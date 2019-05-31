

//Popis:
/// <reference path="C:\Projects\Asahi\Development\Resco\www\Common\pe_GlobalCommonFunctions.js" />
/// <reference path="C:\Projects\Asahi\Development\Resco\www\Common\JSBridge.js" />



// vse se deje async takze krok 1 startuje krok 2 atd...

// 0. predrazen krok 0 smazeni vsech predeslich benefitu

//1. nacte vsechny objednane produkty ktere jsou v objednavce a v nejake kampani

//2. roztridi produkty podle kampani          

//3. nacte definice kampani(sekce) podle pomoci group z produktu(krok 2) na kampan


//4 roztrid sety jednotlivych definic kampani(krok 3)

// vypocte pocet voucheru pro kampane
// veznu zbozi a doplnim ho do kosiku.
// pro pridavani zbozi do kosiku prochazim zbozi a hledam nejblizsi prvni kosik ve kterem toto zbozi neni pri pridavani se bere ohled na set 
// a v prvnim pruchopdu doplnuji pouze do minima pokud uz zbozi v kosiku je doplnim ho do maxima pouze v pripade ze jsou vsechna ostatni dolnena do minima



var OrderCampaign = OrderCampaign ||
{
    OnCloseDialog: null,

    RecalculateVoucherToCampaign: function (orderId, accountRef, setCampaingInfoListCallback, completedCallback)
    {
        OrderCampaign.OnCloseDialog = MobileCRM.UI.Form.showPleaseWait("Recalculating ...");
        OrderCampaign.Step0_DeleteAllBenefitsFromOrder(orderId, accountRef, setCampaingInfoListCallback, completedCallback);
    },

    CloseWaitDialog:function()
    {
        try {
            if (!LLP.Common.IsNullOrEmpty(OrderCampaign.OnCloseDialog))
            {
                OrderCampaign.OnCloseDialog.close();
            }
        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.CloseWaitDialog", e);
        }
    },

    Step0_DeleteAllBenefitsFromOrder: function (orderId, accountRef, setCampaingInfoListCallback, completedCallback)
    {
        try {
            var fetchXML =
                      '<fetch > \
                            <entity name="pe_benefit" >\
                            <attribute name="pe_benefitid" />\
                            <filter>\
                              <condition attribute="pe_orderid" operator="eq" value="' + orderId + '" />\
                            </filter>\
                          </entity>\
                        </fetch>';

            MobileCRM.FetchXml.Fetch.deserializeFromXml(fetchXML, function (fetch)
            {

                fetch.execute("DynamicEntities",
                    function (result)
                    {
                        if (result && result.length > 0) {
                            for (var indexBenefit = 0; indexBenefit < result.length; indexBenefit++) {

                                MobileCRM.DynamicEntity.deleteById("pe_benefit", result[indexBenefit].id,
                                function ()
                                {
                                    // Success
                                },
                                function (deleteError)
                                {
                                    LLP.LOG.Error(LLP.Enums.Module.Contract, "Step0_DeleteAllBenefitsFromOrder -> deleting  pe_benefit Error. ID: '" + result[indexBenefit].id + "failed: ", deleteError);
                                });
                            }
                        }

                        OrderCampaign.Step1_ReadProductFromOrder(orderId, accountRef, setCampaingInfoListCallback, completedCallback);

                    },
                    function (error)
                    {
                        LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.LoadPreviousOrder", error);
                        MobileCRM.bridge.alert(error);
                    }
                );

            }, MobileCRM.bridge.alert);
        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.Step0_DeleteAllBenefitsFromOrder", e);
        }

    },

    Step1_ReadProductFromOrder: function (orderId, accountRef, setCampaingInfoListCallback, completedCallback)
    {
        try {
            var fetchXML =
                       '<fetch> \
                            <entity name="pe_orderproduct" > \
                            <attribute name="pe_numberofunits" /> \
                            <attribute name="pe_campaignid" /> \
                            <attribute name="pe_productid" /> \
                            <attribute name="pe_orderid" /> \
                            <filter> \
                              <condition attribute="pe_campaignid" operator="not-null" /> \
                              <condition attribute="pe_orderid" operator="eq" value="'+ orderId +'" /> \
                            </filter> \
                          </entity> \
                        </fetch>';

            MobileCRM.FetchXml.Fetch.deserializeFromXml(fetchXML, function (fetch)
            {
            
                fetch.execute("DynamicEntities",
                    function (result)
                    {
                        if (result && result.length > 0) {

                            OrderCampaign.Step2_ReadProductFromOrderCallback(orderId, result, accountRef, setCampaingInfoListCallback, completedCallback);

                        }
                    },
                    function (error)
                    {
                        LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.LoadPreviousOrder", error);
                        MobileCRM.bridge.alert(error);
                    }
                );

            }, MobileCRM.bridge.alert);



        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.Step1_ReadProductFromOrder", e);
        }
    },

    Step2_ReadProductFromOrderCallback: function (orderId, orderProductList, accountRef, setCampaingInfoListCallback, completedCallback)
    {
        try {

            if (orderProductList == null)
                return;
            if (orderProductList.length == 0)
                return;


            // roztridim produkty podle kampani
            // ziskam Id Kampane a roztridene produkty podle kampani
            var campaingDefinitionList = [];

            for (var indexProduct = 0; indexProduct < orderProductList.length; indexProduct++) {

                if(LLP.Common.IsNullOrEmpty(orderProductList[indexProduct].properties.pe_numberofunits))
                    continue;

                var addCampaing = true;

                for (var indexCampaing = 0; indexCampaing < campaingDefinitionList.length; indexCampaing++) {
                    if (campaingDefinitionList[indexCampaing].CampaignId == orderProductList[indexProduct].properties.pe_campaignid.id)
                    {
                        addCampaing = false;
                        // jiz existuje pridam pouze produkt

                        var productOrder = new OrderCampaign.CreateProduct(
                            orderProductList[indexProduct].properties.pe_productid,
                            orderProductList[indexProduct].properties.pe_numberofunits);

                        campaingDefinitionList[indexCampaing].ProductOrderList.push(productOrder);
                        break;
                    }
                }
                if (addCampaing)
                {
                    // pridam kampan a produkt
                    var campDef = new OrderCampaign.CreateCampaignDefinitionObject(
                        orderProductList[indexProduct].properties.pe_campaignid,
                        orderProductList[indexProduct].properties.pe_productid,
                        orderProductList[indexProduct].properties.pe_numberofunits,
                        orderProductList[indexProduct].properties.pe_orderid,
                        accountRef
                        );

                    campaingDefinitionList.push(campDef);
                }

            }

            OrderCampaign.Step3_ReadCampaigDefinition(orderId, campaingDefinitionList, setCampaingInfoListCallback, completedCallback);

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.Step1_ReadProductFromOrderCallback", e);
        }
    },

    Step3_ReadCampaigDefinition: function (orderId, campaingDefinitionList, setCampaingInfoListCallback, completedCallback)
    {
        try {

            var fetchXmlPart = '';
            for (var i = 0; i < campaingDefinitionList.length; i++) {
                fetchXmlPart += '<value>' + campaingDefinitionList[i].CampaignId + '</value>';
            }

            var fetchXML = '<fetch >\
              <entity name="pe_section" >\
                <attribute name="pe_minimumpieces" />\
                <attribute name="pe_sectionid" />\
                <attribute name="pe_maximumpieces" />\
                <link-entity name="pe_sectionproduct" from="pe_sectionid" to="pe_sectionid" >\
                  <attribute name="pe_productid" alias="ProductId"/>\
                  <attribute name="pe_sectionid" alias="SectionId" />\
                  <link-entity name="pe_section" from="pe_sectionid" to="pe_sectionid" >\
                    <attribute name="pe_minimumpieces" alias="MinimumSection" />\
                    <attribute name="pe_maximumpieces" alias="MaximumSection" />\
                    <link-entity name="pe_campaignsection" from="pe_sectionid" to="pe_sectionid" >\
                      <attribute name="pe_campaignid" alias="CanpaignId" />\
                      <filter>\
                        <condition attribute="pe_campaignid" operator="in" >\
                          '+ fetchXmlPart + '\
                        </condition>\
                      </filter>\
                      <link-entity name="campaign" from="campaignid" to="pe_campaignid" >\
                            <attribute name="pe_maximumnumberofpackages" alias="MaximumNumberOfPackage" />\
                            <attribute name="pe_numberofproducts" alias="NumberOfProduct" />\
                            <attribute name="pe_numberofbenefitsperpackage" alias="NumberOfBenefitPerPackage" />\
                      </link-entity>\
                    </link-entity>\
                  </link-entity>\
                </link-entity>\
              </entity>\
            </fetch>';

            MobileCRM.FetchXml.Fetch.deserializeFromXml(fetchXML, function (fetch)
            {

                fetch.execute("DynamicEntities",
                    function (definitionProduct)
                    {
                        if (definitionProduct && definitionProduct.length > 0) {

                            OrderCampaign.Step4_ReadCampaigDefinitionCallback(orderId, definitionProduct, campaingDefinitionList, setCampaingInfoListCallback, completedCallback);

                        }
                    },
                    function (error)
                    {
                        LLP.LOG.Error(LLP.Enums.Module.Order, "Order.LoadPreviousOrder", error);
                        MobileCRM.bridge.alert(error);
                    }
                );

            }, MobileCRM.bridge.alert);



        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.Step3_ReadCampaigDefinition", e);
        }
    },

    Step4_ReadCampaigDefinitionCallback: function (orderId, definitionProduct, campaingDefinitionList, setCampaingInfoListCallback, completedCallback)
    {
        try {
        // roztridim data z fetche
        // pridam definice pro campane a roztridim sety, 

        for (var indexCampaignDef = 0; indexCampaignDef < campaingDefinitionList.length; indexCampaignDef++) {

            for (var indexProduct = 0; indexProduct < definitionProduct.length; indexProduct++) {
                
                if (definitionProduct[indexProduct].properties.CanpaignId.id== campaingDefinitionList[indexCampaignDef].CampaignId)
                {   // je to definice produktu v setu pro tuto kampan

                    // je potreba najit set a pridat do nej produkt
                    OrderCampaign.AddProductToCampaing(definitionProduct[indexProduct], campaingDefinitionList[indexCampaignDef]);

                }

            }
        }


        var listComputedCampaign = [];

        // ROZPOCITANI jednotlivych kosiku KOSIKU
        // a zde je mozne zacit rozpocitavat do kosiku pro jednotlive kampane
        for (var i = 0; i < campaingDefinitionList.length; i++) {
            var camoputeCampaign = OrderCampaign.RecalculateCampaignProductToBasket(campaingDefinitionList[i]);
            listComputedCampaign.push(camoputeCampaign)
        } 
       
        OrderCampaign.CloseWaitDialog();



        if (setCampaingInfoListCallback) {
            setCampaingInfoListCallback(campaingDefinitionList);
        }


        // ULOZENI BENEFITU

        for (var i = 0; i < listComputedCampaign.length; i++) {


            var newPe_Benefit = new MobileCRM.DynamicEntity.createNew("pe_benefit");

            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_orderid", listComputedCampaign[i].CampaingDefinition.OrderRef);
            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_campaignid", listComputedCampaign[i].CampaingDefinition.CampaignRef);

            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_accountid", listComputedCampaign[i].CampaingDefinition.AccountRef);

            //pocet vsech potencialnich kosiku: pe_theoreticalnumberofpackages
            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_theoreticalnumberofpackages", listComputedCampaign[i].TheoreticalNumberOfPackages);
            //pocet vsech potencialnich voucheru: pe_theoreticalnumberofbenefits (pe_theoreticalnumberofpackages * campaign.pe_numberofbenefitsperpackage)
            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_theoreticalnumberofbenefits", listComputedCampaign[i].TheoreticalNumberOfBenefits );
            //pocet maximalnich kosiku: pe_numberofsoldpackages (campaign.pe_maximumnumberofpackages - toto je max z pe_theoreticalnumberofpackages)
            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_numberofsoldpackages", listComputedCampaign[i].NumberOfSoldPackages);
            //pocet maximalnich voucheru: pe_numberofbenefits (stejna logika, jen zde vynasobit: pe_numberofsoldpackages * campaign.pe_numberofbenefitsperpackage)
            LLP.Common.SetAttributeValue(newPe_Benefit, "pe_numberofbenefits", listComputedCampaign[i].NumberOfSoldBenefits);

            newPe_Benefit.save(
                function (err)
                {
                    if (err) {
                        LLP.LOG.Error(LLP.Enums.Module.Order, "Save newPe_Benefit row: ", err);
                    }
                    else {

                    }
                }
            );



        }


       
    
        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.Step3_ReadCampaigDefinition", e);
        }
    },

    AddProductToCampaing: function (definitionProduct,campaingDefinition)
    {
        // prohledam definici produktu v setu a pridam set a produkt do definice kampane pokud set existuje tak jenom produkt
        try {
            var add = true;
            for (var i = 0; i < campaingDefinition.SectionList.length; i++) {

                
                if (campaingDefinition.SectionList[i].SectionId == definitionProduct.properties.SectionId.id)
                {
                    add = false;

                    var product = new OrderCampaign.CreateProduct(definitionProduct.properties.ProductId, null);
                    campaingDefinition.SectionList[i].ProductList.push(product);
                    break;
                }

            }
            if (add)
            {
                // pridam set
                var section = new OrderCampaign.CreateSection(
                    definitionProduct.properties.SectionId,
                    definitionProduct.properties.MinimumSection,
                    definitionProduct.properties.MaximumSection,
                    definitionProduct.properties.ProductId
                    );

                campaingDefinition.NumberOfProduct = definitionProduct.properties.NumberOfProduct;
                campaingDefinition.NumberOfBenefitPerPackage = definitionProduct.properties.NumberOfBenefitPerPackage;
                campaingDefinition.MaximumNumberOfPackage = definitionProduct.properties.MaximumNumberOfPackage;

                campaingDefinition.SectionList.push(section);

            }

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.AddProductToCampaing", e);
        }
    },

    RecalculateCampaignProductToBasket: function(campaingDefinition)
    {
        try {
            // celkovy pocet KS
            var productCount = OrderCampaign.GetProductCount(campaingDefinition.ProductOrderList);

            // kolik uz jsem toho dal do kosiku
            var productInBasket = 0;

            var basketList = [];

            var stopka =0;

            var previousBasketCount = 0;
            var previousProductInBasket = 0;
            
            // rozdeleni zbozi do kosiku
            while (productCount > productInBasket)
            {
                for (var indexProduct = 0; indexProduct < campaingDefinition.ProductOrderList.length; indexProduct++) {
                    
                    var product = campaingDefinition.ProductOrderList[indexProduct];
                    if (product.NumberOfUnits > 0 )
                        {
                        if (product.NumberOfUnits - product.NumberInBasket > 0) {
                            var count = OrderCampaign.AddProductToBasketList(basketList, product, campaingDefinition, campaingDefinition.ProductOrderList);
                            productInBasket = productInBasket + count;

                            //if (count == 0)
                            //{
                            //    stopka++;
                            //}
                        }
                    }

                }

               
                if (previousBasketCount != basketList.length || productInBasket != previousProductInBasket) {
                    previousBasketCount = basketList.length;
                    previousProductInBasket = productInBasket;
                    stopka = 0;
                }
                else {
                    stopka++;
                }

                if (stopka >= productCount)
                {  //toto mam pouze pro jistotu at se to nekousne
                    LLP.LOG.Error(LLP.Enums.Module.Order, "RecalculateCampaignProductToBasket 'GENERAL STOP'", null);
                    //MobileCRM.bridge.alert("Recalculate GENERAL STOP!. Contact CRM Administrator.");
                    break;
                }
            }

            // vsechny plne kosiky
            var completedBasketList = [];
            // kosiky ktere jeste nejsou plne
            var incompletedBasketList = [];

           // roztrideni plnych a neplnych kosiku
            for (var indexBasket = 0; indexBasket  < basketList.length; indexBasket ++) {

                var basket = basketList[indexBasket];

                if (basket.MaximumOfBasket == basket.InsertInBasketCount) {
                    // sice sedi celkovy pocet KS ale je potreba zkontrolovat i pocet na minimum v SETU
                    var allSectionHasMinnimum = true;
                    for (var i = 0; i < basket.SectionDefinitionList.length; i++) {

                        if (basket.SectionDefinitionList[i].NumberInBasket < basket.SectionDefinitionList[i].Minimum) {
                            // sekce nedosahala minnima takze kosik je povazovan za nekompletni
                            allSectionHasMinnimum = false;
                            break;
                        }
                    }

                    if (allSectionHasMinnimum)
                        completedBasketList.push(basket);
                    else
                        incompletedBasketList.push(basket);
                }
                else {
                    incompletedBasketList.push(basket);
                }
            }

            var textLog = "Completed: " + completedBasketList.length + " Incompleted:" + incompletedBasketList.length;
            textLog = textLog + OrderCampaign.WtiteBasketTostring(completedBasketList, "Completed: ");
            textLog = textLog + OrderCampaign.WtiteBasketTostring(incompletedBasketList, "Incompleted: ");


          

            //MobileCRM.UI.IFrameForm.showModal("TestIframe", "https://www.google.cz", options = { text: "Some Text as option." });

            //MobileCRM.bridge.alert(textLog);

            var numberOfSoldPackages = campaingDefinition.MaximumNumberOfPackage;

            if(numberOfSoldPackages>completedBasketList.length){
                numberOfSoldPackages=completedBasketList.length;
            }

            //pocet maximalnich voucheru: pe_numberofbenefits (stejna logika, jen zde vynasobit: pe_numberofsoldpackages * campaign.pe_numberofbenefitsperpackage)
            var numberOfSoldBenefits = numberOfSoldPackages * campaingDefinition.NumberOfBenefitPerPackage;

            var returnObject = {
                CompletedBasketCount: completedBasketList.length,
                IncompletedBasketCount: incompletedBasketList.length,
                CompletedBasketList: completedBasketList,
                IncompletedBasketList: incompletedBasketList,
                CampaingDefinition: campaingDefinition,
                TheoreticalNumberOfPackages: completedBasketList.length,
                NumberOfBenefitPerPackage: campaingDefinition.NumberOfBenefitPerPackage,
                TheoreticalNumberOfBenefits: campaingDefinition.NumberOfBenefitPerPackage * completedBasketList.length,
                NumberOfSoldPackages: numberOfSoldPackages,
                NumberOfSoldBenefits: numberOfSoldBenefits
            };

            return returnObject;
           

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.RecalculateProductToBasket", e);
            return null;
        }
    },

    WtiteBasketTostring: function (basketList, title)
    {
        try {

            var logTxt = "\r\n\r\n" + title;
            for (var indexBasket = 0; indexBasket < basketList.length; indexBasket++) {

                var basket = basketList[indexBasket];
                logTxt += "\r\nBasket '"+(indexBasket+1) +"' -----------------------";
                

                for (var indexSection = 0; indexSection < basket.SectionDefinitionList.length; indexSection++) {

                    var section = basket.SectionDefinitionList[indexSection];
                    logTxt += "\r\n   Section: '" + section.SectionName + "' NumberInBasket: '" + section.NumberInBasket + "'";

                    for (var indexSectionProduct = 0; indexSectionProduct < section.ProductList.length; indexSectionProduct++) {

                        var sectionProduct = section.ProductList[indexSectionProduct];
                        for (var i = 0; i < basket.ProductInBasket.length; i++) {
                            var product = basket.ProductInBasket[i];

                            if (product.ProductId == sectionProduct.ProductId) {
                                logTxt += ' \r\n      Product: ' + product.NumberInBasket + ' ' + product.ProductName;
                            }
                        }

                    }

                }
                
                

               
            }
            return logTxt;

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.WtiteBasketTostring", e);
        }
    },


    AddProductToBasketList: function (basketList, product, campaingDefinition, productOrderList)
    {
        try {
            // budu zakladat dalsi kosik?
            var createBasket = true;

            // najdu kosik ktery nema naplneno minima pro toto zbozi?
            for (var i = 0; i < basketList.length; i++) {

                var basket = basketList[i];

                // pouze pokud v kosiku neni dost
                if(basket.InsertInBasketCount<basket.MaximumOfBasket)
                {
                    var productInBasket = OrderCampaign.GetProductFromBasket(basket, product);
                    // zbozi neni v kosiku
                    if (productInBasket == null) {
                        // v kosiku sice toto zbozi nemam ale zkontroluju zda tam neni neco ze setu
                        var productBasketDefinition = OrderCampaign.GetProductFromDefinition(basket.SectionDefinitionList, product);

                        // v tomto setu jeste neni naplneno minimum
                        if (productBasketDefinition.NumberInBasket < productBasketDefinition.Minimum) {
                            var count = OrderCampaign.AddProductToBasket(basket, product, campaingDefinition);
                            return count;
                        }
                        else {
                            // tento produkt je v sekci ktera uz ma naplnene minimum
                            // muzu ale tento produkt pridat pouze v pripade pokud i ostatni sekce maji naplnene minimum
                            if (OrderCampaign.AllProductMinimumFull(basket.SectionDefinitionList, productOrderList)) {

                                if (productBasketDefinition.Minimum == 0) {
                                    // zkontroluji zda neni minimum 0 pokud jo pridam zbozi do kosiku
                                    var count = OrderCampaign.AddProductToBasket(basket, product, campaingDefinition);
                                    return count;
                                }
                                else if (productBasketDefinition.Maximum > productBasketDefinition.NumberInBasket) {
                                    //jeste neni naplnen kosik a toto zbozi v kosiku neni ale ze setu je jiz pridano nejake jine zbozi
                                    var count = OrderCampaign.AddProductToBasket(basket, product, campaingDefinition);
                                    return count;
                                }
                            }
                            else {
                                // do tohoto kosiku nelze ted pripad protoze nema splnena vsechny minima
                                return 0;
                            }
                        }
                    }
                    else {
                        // produkt uz je v kosiku a toto se muze stat pouze pri dalsim pruchodu takze je do doplnovani

                        //kolik je toho pridano z tohoto setu?
                        var productBasketDefinition = OrderCampaign.GetProductFromDefinition(basket.SectionDefinitionList, product);

                        if (productBasketDefinition.Maximum==0 || productBasketDefinition.Maximum >= productBasketDefinition.NumberInBasket) {
                            //jeste neni naplnen kosik a toto zbozi v kosiku neni ale ze setu je jiz pridano nejake jine zbozi
                            var count = OrderCampaign.AddProductToBasket(basket, product, campaingDefinition);
                            return count;
                        }
                    }
                }
            }

            if (createBasket)
            {
                var basket = new OrderCampaign.CreateBasket(campaingDefinition.NumberOfProduct, campaingDefinition);
                // kolik se pridano do tohoto kosiku
                var count = OrderCampaign.AddProductToBasket(basket, product, campaingDefinition);

                if (count > 0) {
                    basketList.push(basket);
                }

                return count;
            }

        } catch (e) {

            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.AddProductToBasketList", e);
            return 0;
        }
    },


    AllProductMinimumFull: function (baskeSectionDefinitionList, productOrderList)
    { // zjistim zda vsechny produkty v kosiku maji naplnene minimum
        try {
            for (var i = 0; i < baskeSectionDefinitionList.length; i++) {

                if (baskeSectionDefinitionList[i].Minimum > baskeSectionDefinitionList[i].NumberInBasket)
                {
                    // musim zjistit zda jeste mam z ceho davat minimum pro set
                    var baskeSectionDefinition = baskeSectionDefinitionList[i];
                    for (var indexProductSection = 0; indexProductSection < baskeSectionDefinition.ProductList.length; indexProductSection++) {

                        var productFromSetDefinition = baskeSectionDefinition.ProductList[indexProductSection];
                        var productInOrder = OrderCampaign.GetProductFromList(productOrderList, productFromSetDefinition)
                        if (productInOrder != null && productInOrder.NumberInBasket<productInOrder.NumberOfUnits)
                        {
                            return false;
                        }
                    }
                }
            }
            return true;

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.AddProductToBasketList", e);
        }
    },

    AddProductToBasket: function(basket,product,campaingDefinition)
    {
        try {

            // kolik jeste mam produktu v objednavce?
            var productOrderCount = product.NumberOfUnits - product.NumberInBasket;
            if (productOrderCount <= 0) {
                // neni co pridavat;
                return 0;
            }

            var add = true;
            // zjistim zda uz v tomto kosiku tento produkt nemam
            var productInBasket = OrderCampaign.GetProductFromBasket(basket,product);
            // zjistim zda je tento produkt v definici kosiku
            
            //var productInDefinition = new OrderCampaign.GetProductFromDefinition(campaingDefinition.SectionList, product);
            var productInDefinition = new OrderCampaign.GetProductFromDefinition(basket.SectionDefinitionList, product);
          
            var newInBasket = false;
            if (productInBasket == null) {
                newInBasket = true;
                productInBasket = new OrderCampaign.CreateProduct(product.ProductRow, 0);
            }

            if (productInDefinition)
            {
                // pocet kolik budeme davat
                var oddedNumberCount = 0;
                // v kosiku mam min nez kosik potrebuje.

                // kolik muzu pridat do plneho kosiku bez ohledu na zbozi
                var addMaxCount = basket.MaximumOfBasket - basket.InsertInBasketCount;

                // kolik muzu dat maximalne tohoto zbozi
                var addMaxProductCount = productInDefinition.Maximum - productInDefinition.NumberInBasket;

                if (productInDefinition.Maximum == 0)
                {   // maximum neni stanoveno takze to je vsechno volne misto v kosiku;
                    addMaxProductCount = addMaxCount;
                }

                if (addMaxProductCount == 0) {
                    // toto zbozi jiz slo do max a nelze ho do tohoto kosiku pridavat
                    return 0;
                }

                if (addMaxProductCount < addMaxCount) {
                    // nemuzu tam dat vice nez je max pro tento set na kosik
                    addMaxCount = addMaxProductCount;
                }

                if (productInDefinition.Minimum == 0 && addMaxCount >= 1)
                {
                    // neni stanoveno minimum takze pridam pouze jeden ks
                    
                    oddedNumberCount = 1;
                }
                else if (productInDefinition.Minimum > 0) {
                    // je stanoveno minimum takze pridam minimum
                        
                    //mam min nez potrebuji tak dam vsechno
                    if (productInDefinition.Minimum > productOrderCount) {
                        if (addMaxCount >= productOrderCount)
                            oddedNumberCount = productOrderCount;
                        else
                            oddedNumberCount = addMaxCount;
                    }
                    else {
                        // doplnit minimum naplno
                        if (addMaxCount >= productInDefinition.Minimum) {

                            if (productInDefinition.Minimum > productInDefinition.NumberInBasket) {
                                // nejdrive doplnuji minimum pro kazdy set
                                // nemuzu to hned preslahnout protoze to bude chybet jinde
                                oddedNumberCount = productInDefinition.Minimum - productInDefinition.NumberInBasket;
                            }
                            else {
                                oddedNumberCount = productInDefinition.Minimum;
                            }

                        }
                        else { //dam pouze tolik kolik uunese kosik
                            oddedNumberCount = addMaxCount;
                        }
                    }
                }

                product.NumberInBasket += oddedNumberCount;
                productInBasket.NumberInBasket += oddedNumberCount;
                // musim si pocitak i kolik zbozi mam v ramci SETU
                productInDefinition.Section.NumberInBasket += oddedNumberCount;
                basket.InsertInBasketCount += oddedNumberCount;
                if (newInBasket) {
                    basket.ProductInBasket.push(productInBasket);
                }

                return oddedNumberCount;
            }

            return 0;

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.AddProductToBasket", e);
        }
    },

    GetProductFromDefinition: function (sectionList, productFind)
    {
        try {
            
            for (var indexSection = 0; indexSection < sectionList.length; indexSection++) {
                // hledam tento produkt v sekci
                for (var indexProduct = 0; indexProduct < sectionList[indexSection].ProductList.length; indexProduct++) {
                    var product = sectionList[indexSection].ProductList[indexProduct];
                    if (product.ProductId == productFind.ProductId) {

                        var returnObject =
                        {
                            Section: sectionList[indexSection],
                            product: product,
                            Minimum: sectionList[indexSection].Minimum,
                            Maximum: sectionList[indexSection].Maximum,
                            NumberInBasket: sectionList[indexSection].NumberInBasket,
                        };
                        return returnObject;
                    }
                }
            }
            return null;

        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.GetProductFromBasket", e);
            return null;
        }
    },

    GetProductFromBasket: function(basket, product)
    {
        try {
            for (var i = 0; i < basket.ProductInBasket.length; i++) {
                if (basket.ProductInBasket[i].ProductId == product.ProductId) {
                    return basket.ProductInBasket[i];
                }
            }
            return null;
        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.GetProductFromBasket", e);
        }
    },

    CreateBasket: function (maximumOfBasket, campaingDefinition)
    {
        this.CampaignDefinition = campaingDefinition;
        // kolik KS muzu vlozit do kosiku
        this.MaximumOfBasket = maximumOfBasket;
        // kolik KS mam v kosiku vlozeno celkem
        this.InsertInBasketCount = 0;

        // rozdeleni prihradek na zbozi podle definice
        this.SectionDefinitionList= [];

        // zbozi v kosiku
        this.ProductInBasket = [];

        for (var i = 0; i < campaingDefinition.SectionList.length; i++) {

            var section = campaingDefinition.SectionList[i];
            var sectionDefinition = new OrderCampaign.CreateSection(section.SectionRow, section.Minimum, section.Maximum, null);

            // pridam si definice produktu co muze do kosiku
            for (var indexProduct = 0; indexProduct < section.ProductList.length; indexProduct++) {
                var product = new OrderCampaign.CreateProduct(section.ProductList[indexProduct].ProductRow, 0);
                sectionDefinition.ProductList.push(product);
            }
            this.SectionDefinitionList.push(sectionDefinition);
        }
    },

    // vrati celkovy pocet kolik zbozi ma na tuto kampan nakoupenych
    GetProductCount: function (productOrderList)
    {
        try {
            var count = 0;

            for (var i = 0; i < productOrderList.length; i++) {

                if (LLP.Common.IsNullOrEmpty(productOrderList[i].NumberOfUnits))
                {
                    // musim si tam nahrat ZERO jinak to padne
                    productOrderList[i].NumberOfUnits = 0;
                }

                count += productOrderList[i].NumberOfUnits - productOrderList[i].NumberInBasket;
            }

            return count;
        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.ProductCount", e);
        }
    },

    GetProductFromList: function (productOrderList,product)
    {  // dohleda produkt v listu objednaneho zboizi
        try {
            
            for (var i = 0; i < productOrderList.length; i++) {

                if (productOrderList[i].ProductId == product.ProductId) {
                    
                    return productOrderList[i];
                }
            }

            return null;
        } catch (e) {
            LLP.LOG.Error(LLP.Enums.Module.Order, "OrderCampaign.GetProductFromList", e);
            return null;
        }
    },

    CreateCampaignDefinitionObject: function (campaignId, productId, numberOfUnits, orderid, accountRef)
    {
        this.CampaignId = campaignId.id,
        this.CampaignName = campaignId.primaryName,
        this.CampaignRef = campaignId;
        // produkty z objednavky
        this.ProductOrderList = [];
        // definice setu a produktu
        this.SectionList = []

        this.OrderRef = orderid;
        
        this.AccountRef = accountRef;

        // kolik ks je potreba pro jeden Kosik
        this.NumberOfProduct = 0;

        // kolik dame maximalne benefitu za kampan
        this.MaximumNumberOfPackage = 0;

        // kolik benefitu dame za kosik
        this.NumberOfBenefitPerPackage = 0;

        // kolik voucheru dostane za jeden kosik
        //this.BasketBenefitCount = 0;

        var product = new OrderCampaign.CreateProduct(productId, numberOfUnits);
        this.ProductOrderList.push(product);
    },


    CreateProduct: function (product,numberOfUnits)
    {
        this.ProductRow = product;
        this.ProductId = product.id;
        this.ProductName = product.primaryName;

        // kolik je v kosiku objednane
        this.NumberOfUnits = numberOfUnits;

        // kolik jsem z kosiku odebral
        this.NumberInBasket = 0;
    },


    CreateSection: function (section, mininum, maximum, productId)
    {
        this.SectionRow = section;
        this.SectionId = section.id,
        this.SectionName = section.primaryName;

        if (LLP.Common.IsNullOrEmpty(mininum))
            mininum = 0;
        this.Minimum = mininum;

        if (LLP.Common.IsNullOrEmpty(maximum))
            maximum = 0;
        this.Maximum = maximum;


        this.ProductList = [];
        this.NumberInBasket = 0;

        if (productId != null) {
            var product = new OrderCampaign.CreateProduct(productId, null);
            this.ProductList.push(product);
        }

    }
    

}