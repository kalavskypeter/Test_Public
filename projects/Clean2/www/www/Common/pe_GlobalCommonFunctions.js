var LLP = LLP || {
    entityForm: null,
    SystemUser: null,
    SetExecutionContext: function (entityForm) {
        LLP.entityForm = entityForm;
    },
    Enums: {
        DocumentAction: {
            /** No action.*/
            None: 0x0000,
            /** Configures the view for ink input.*/
            CaptureInk: 0x0001,
            /** Asks the user to capture a photo and loads the choosen media into the view.*/
            CapturePhoto: 0x0002,
            /** Asks the user to choose a media (image, video, depending on what the platform supports) and loads the choosen media into the view.*/
            SelectPhoto: 0x0004,
            /** Asks the user to choose a file and loads it into the view.*/
            SelectFile: 0x0008,
            /** Asks the user to record an audio note and loads it into the view.*/
            RecordAudio: 0x0010,
            /** Asks the user to record a video and loads it into the view.*/
            RecordVideo: 0x0020,
            /** Gets last photo taken and loads it into the view.*/
            UseLastPhotoTaken: 0x0040,
            /** Asks the user to choose file from either online or offline location and loads it into the view.*/
            LoadFrom: 0x0080,
 
            /** Clears the view and marks it as empty.*/
            Clear: 0x1000,
            /** Shows a preview of the loaded document (fullscreen, etc.).*/
            View: 0x2000,
            /** Opens the loaded document in a external application. Which application is platform specific.*/
            OpenExternal: 0x4000,
            /** Sends the document to another application. This command is implemented only on Android.*/
            SendTo: 0x8000,
            /** Virtual action handled in common code.*/
            Download: 0x10000,
            /** Copy image to clipboard.*/
            Copy: 0x20000,
            /** Paste image from clipboard.*/
            Paste: 0x40000,
            /** Prints the document.*/
            Print: 0x80000,
            /** Let user to choose smaller image resolution.*/
            ResizeImage: 0x100000,
            /** Let user import VCard attachment (handled in common code).*/
            Import: 0x200000,
            /** Pass document to edit in external app (Microsoft office so far[15.6.2015]).*/
            Edit: 0x400000,
            /** Send document as attachment.*/
            Email: 0x800000,
            /** Ask the user to choose multiple images.*/
            SelectMultiplePhotos: 0x1000000,
            /** Asks the user to choose multiple files from either online or offline location and loads it into the view.*/
            LoadFromMultiple: 0x2000000,
            /** Opens image in the image editor.*/
            EditImage: 0x4000000,
            /** Saves to file to disk.*/
            Export: 0x8000000,
            /** Actions that are non-destructive.*/
            ReadOnlyMask: 0x88AE000 // SendTo | View | OpenExternal | Print | Email | Copy | Export
        },
        Module: {
            Appointment: "Appointment",
            CollectionofCap: "Collection Of Caps",
            Campaign: "Campaign",
            CampaignExecution: "Campaign Execution",
            CampaignExecutionProduct: "Campaign Execution Product",
            CampaignExecutionProductRow: "Campaign Execution Product Row",
            Case: "Case",
            Complaint: "Complaint",
            Contract: "Contract",
            ContractHeader: "Contract Header",
            ContractHeaderAccount: "Contract Header Account",
            ContractMonitoring: "Contract Monitoring",
            ContractMonitoringTerm: "Contract Monitoring Term",
            ContractTerm: "Contract Term",
            Enrollment: "Enrollment",
            InventoryCheck: "Inventory Check",
            InventoryCheckLine: "Inventory Check Line",
            InventoryCheckLineRow: "Inventory Check Line Row",
            MAOtherOff: "MAOtherOff",
            MAOtherOn: "MAOtherOn",
            MASegmentationOn: "MA Segmentation On",
            MASegmentationTTMT: "MASegmentationTTMT",
            MAServiceOn: "MAServiceOn",
            Order: "Order",
            OrderBenefit: "OrderBenefit",
            OrderProductAllProducts: "Order Product - All Products",
            OrderProductAllProductsRow: "Order Product Row - All Products",
            OrderProductPriceCheck: "Order Product - Price Check",
            OrderProductPriceCheckRow: "Order Product Row - Price Check",
            OrderProductAllProductsRowCommon: "Order Product All Products Row - Common",
            OvertimeRequest: "Overtime Request",
            ProductExchange: "Product Exchange",
            ProductExchangeIssuedProduct: "Product Exchange Issued Product",
            ProductExchangeReturnedProduct: "Product Exchange Returned Product",
            Questionnaire: "Questionnaire",
            TableSurvey: "Table Survey",
            Task: "Task",
            Voucher: "Voucher",
            VoucherAssignment: "Voucher Assignment",
            WorkOrder: "Work Order"
        }
    },
    GlobalEvents: {
        OrderProductAllProductsRecalculate: "OrderProductAllProductsRecalculate",
        OrderProductAllProductsRowSave: "OrderProductAllProductsRowSave",
        InventoryCheckCompleted: "InventoryCheckCompleted",
        ContractMonitoringCompleted: "ContractMonitoringCompleted",
    },
    Common: {
        Attribute_Get: function (viewName, attributeName) {
            for (var i = 0; i < LLP.entityForm.detailViews.length; i++) {
                if (LLP.entityForm.detailViews[i].name == viewName) {
                    return LLP.entityForm.detailViews[i].getItemByName(attributeName);
                }
            }

            return null;
        },
        Attribute_GetAllByName: function (attributeName) {
            var attributes = [];
            for (var i = 0; i < LLP.entityForm.detailViews.length; i++) {
                var attribute = LLP.entityForm.detailViews[i].getItemByName(attributeName);
                if (!LLP.Common.IsNullOrEmpty(attribute)) {
                    attributes.push(attribute);
                }
            }

            return attributes;
        },
        Attribute_GetAllInView: function (viewName) {
            for (var i = 0; i < LLP.entityForm.detailViews.length; i++) {
                if (LLP.entityForm.detailViews[i].name == viewName) {
                    return LLP.entityForm.detailViews[i].items;
                }
            }

            return null;
        },
        Attribute_GetAll: function () {
            try {
                var attributes = [];
                for (var i = 0; i < LLP.entityForm.detailViews.length; i++) {
                    var itemsAttributes = LLP.entityForm.detailViews[i].items;
                    var viewName = LLP.entityForm.detailViews[i].name;
                    for (var indexAtt = 0; indexAtt < itemsAttributes.length; indexAtt++) {

                        if (!LLP.Common.IsNullOrEmpty(itemsAttributes[indexAtt]) && !LLP.Common.IsNullOrEmpty(itemsAttributes[indexAtt].name)) {
                            var value = LLP.Common.Attribute_Get(viewName, itemsAttributes[indexAtt].name);
                            if (value) {
                                attributes.push(value);
                            }
                        }
                    }
                }
                return attributes;
            } catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Common.Attribute_GetAll", e);
            }
        },
        Attribute_GetValue: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            if (LLP.Common.IsNullOrEmpty(attributeObject)) {
                LLP.LOG.Error("Attribute_GetValue Tribute not Exist. Name:" + attributeName, null);
            }

            return attributeObject.value;
        },
        Attribute_SetValue: function (viewName, attributeName, value) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.value = value;
        },
        Attribute_Visibility: function (viewName, attributeName, visible) {
            if (visible) {
                LLP.Common.Attribute_Visible(viewName, attributeName);
            }
            else {
                LLP.Common.Attribute_Invisible(viewName, attributeName);
            }
        },
        Attribute_Visible: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.isVisible = true;
        },
        Attribute_Invisible: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.isVisible = false;
        },
        Attribute_IsRequired: function (viewName, attributeName, required) {
            if (required) {
                LLP.Common.Attribute_Required(viewName, attributeName);
            }
            else {
                LLP.Common.Attribute_NonRequired(viewName, attributeName);
            }
        },
        Attribute_Required: function (viewName, attributeName) {
            LLP.Common.Attribute_RequiredWithPossibleNullValue(viewName, attributeName, null);
        },
        Attribute_RequiredWithPossibleNullValue: function (viewName, attributeName, possibleNullValue) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.validate = true;
            if (LLP.Common.IsNullOrEmpty(LLP.Common.Attribute_GetValue(viewName, attributeName)) ||
                (possibleNullValue != null && possibleNullValue == LLP.Common.Attribute_GetValue(viewName, attributeName))) {
                attributeObject.errorMessage = "Field '" + attributeObject.label + "' must not be empty";
            }
            else {
                attributeObject.errorMessage = "";
            }
        },
        Attribute_NonRequired: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.validate = false;
            attributeObject.errorMessage = "";
        },
        Attribute_Enabled: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.isEnabled = true;
        },
        Attribute_Disabled: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            attributeObject.isEnabled = false;
        },
        Attribute_IsDisabled: function (viewName, attributeName, disabled) {
            if (disabled) {
                LLP.Common.Attribute_Disabled(viewName, attributeName);
            }
            else {
                LLP.Common.Attribute_Enabled(viewName, attributeName);
            }
        },
        Attribute_SetProperties: function(viewName, attributeName, required, visible, disabled) {
            LLP.Common.Attribute_IsRequired(viewName, attributeName, required);
            LLP.Common.Attribute_Visibility(viewName, attributeName, visible);
            LLP.Common.Attribute_IsDisabled(viewName, attributeName, disabled);
        },
        GetAttributeValue: function (entity, attributeName) {
            return entity.properties[attributeName];
        },
        SetAttributeValue: function (entity, attributeName, value) {
            entity.properties[attributeName] = value;
        },
        IsNullOrEmpty: function (val) {
            if (val == null ||
                val == 'undefined' ||
                val == undefined ||
                val == '' ||
                val == "" ||
                val == 'NaN' ||
                val == NaN
                )
                return true;
            return false;
        },
        IsObject: function (o) {
            return null != o &&
              typeof o === 'object' &&
              Object.prototype.toString.call(o) === '[object Object]';
        },
        IsVisible: function (viewName, attributeName) {
            var attributeObject = LLP.Common.Attribute_Get(viewName, attributeName);
            return attributeObject.isVisible;
        },
        GetFetchDate: function (date) {
            return date.getFullYear() + "-" + LLP.Common.SliceNumber(date.getMonth() + 1) + "-" + LLP.Common.SliceNumber(date.getDate()) + " " + LLP.Common.SliceNumber(date.getHours()) + ":" + LLP.Common.SliceNumber(date.getMinutes()) + ":" + LLP.Common.SliceNumber(date.getSeconds());
        },
        SliceNumber: function (number) {
            return ("0" + number).slice(-2)
        },
    },
    Form: {
        IsCreate: function () {
            return LLP.entityForm.entity.isNew;
        },
        Enabled: function (onlyVisisble) {
            try {
                LLP.Form.SetEnabled(true, onlyVisisble);
            } catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Form.Enabled", e);
            }
        },
        Disabled: function (onlyVisible) {
            try {
                LLP.Form.SetEnabled(false, onlyVisible);
            } catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Form.Disabled", e);
            }
        },
        SetEnabled: function (value, onlyVisible) {
            try {
                var attributes = LLP.Common.Attribute_GetAll()
                for (var i = 0; i < attributes.length; i++) {
                    if (!onlyVisible || (onlyVisible && attributes[i].isVisible)) {
                        attributes[i].isEnabled = value;
                    }
                }
            } catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Form.SetEnabled", e);
            }
        },
        // Returns object with default values for specific fields
        GetInitDialogFieldsWithValues: function (fieldNames, entity) {
            var result = { };
            for (var i = 0; i < fieldNames.length; i++) {
                result[fieldNames[i]] = LLP.Common.GetAttributeValue(entity, fieldNames[i]);
            }

            return result;
        }
    },
    HtmlControl: {
        SetDisabled: function (htmlControlId, disabled) {
            try {
                var htmlControl = document.getElementById(htmlControlId);
                if (disabled) {
                    htmlControl.setAttribute("disabled", "disabled");
                }
                else {
                    htmlControl.removeAttribute("disabled");
                }
            }
            catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.HtmlControl.SetDisabled", e);
            }
        },
        IsDisabled: function (htmlControlId) {
            try {
                var htmlControl = document.getElementById(htmlControlId);
                if (htmlControl.getAttribute("disabled")) {
                    return true;
                }

                return false;

            } catch (e) {
                LLP.LOG.Error(LLP.Enums.Module.Order, "Error in GlobalCommonFunction.HtmlControl.IsDisabled", e)
            }
        },
    },
    LOG: {
        Debug: function (message) {
            var myDate = new Date();
            var strdate = ' ' + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + ":" + myDate.getMilliseconds();
            console.debug(strdate + " | " + message);

            if (!LLP.Common.IsNullOrEmpty(message)) {
                console.group("Debug message");
                console.debug(message);
                console.trace();
                console.groupEnd();

                var label = document.getElementById("logLabel");
                if (!LLP.Common.IsNullOrEmpty(label)) {
                    label.innerText = strdate + " | Debug | " + message + "\r\n" + label.innerText;
                }
            }
        },
        Error: function (module, message, error, entity, isInternal) {
            try {
                var myDate = new Date();
                var strdate = ' ' + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + ":" + myDate.getMilliseconds();
                console.error(strdate + " | " + message);
                var errorMessage = LLP.Common.IsObject(error) ? error.message : error;
                if (!LLP.Common.IsNullOrEmpty(message) || !LLP.Common.IsNullOrEmpty(errorMessage)) {
                    console.group("Error message");
                    console.error(message, errorMessage);
                    console.trace();
                    console.groupEnd();

                    var label = document.getElementById("logLabel");
                    if (!LLP.Common.IsNullOrEmpty(label)) {
                        label.innerText = strdate + " | Error | " + message + " | " + errorMessage + "\r\n" + label.innerText;
                    }
                }

                if (!isInternal && MobileCRM) {
                    
                    MobileCRM.Configuration.requestObject(function (config) {
                        LLP.Configuration = config;
                        MobileCRM.DynamicEntity.loadById("systemuser", config.settings.systemUserId,
                                                        function (result) {
                                                            LLP.SystemUser = result;
                                                            var pe_rescotracelog = LLP.Entity.pe_rescotracelog(module, message, error, entity);
                                                            pe_rescotracelog.save(function (err) {
                                                                if (err) {
                                                                    var msg = "Error during saving pe_rescotracelog entity";
                                                                    console.error(msg, err);
                                                                    LLP.LOG.ErrorInternal(msg, err);
                                                                }
                                                            });
                                                        },
                                                        function (error) {
                                                            LLP.LOG.ErrorInternal("LLP.LOG.Error -> load systemuser error", error);
                                                        }, null);
                    },
                    function (error) {
                        LLP.LOG.ErrorInternal("LLP.LOG.Error -> MobileCRM.Configuration.requestObject error", error);
                    }, null);
                }
            } catch (e) {
                console.error('Error in LLP.LOG.Error', e);
            }
        },
        ErrorInternal: function (messge, error) {
            try {
                var label = document.getElementById("logLabel");
                if (!LLP.Common.IsNullOrEmpty(label)) {
                    label.innerText = messge + " | " + error + "\r\n" + label.innerText;
                }
            }
            catch (e) {
                console.error("LLP.LOG.ErrorInternal", e);
            }
        }
    },
    Entity: {
        pe_rescotracelog: function(areaOrModule, message, errorMessage, entity) {

            if(MobileCRM) {
                var pe_rescotracelog = new MobileCRM.DynamicEntity.createNew("pe_rescotracelog");
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_areaormodule", areaOrModule);
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_errormessage", errorMessage.toString());
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_iddevice", LLP.Configuration.settings.internalDeviceId);
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_lastsyncdate", LLP.Configuration.settings.lastSyncDate);
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_message", message);
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_name", LLP.Entity.GetEntityInfo(entity, new Date().toLocaleString() + " | " + areaOrModule));
                LLP.Common.SetAttributeValue(pe_rescotracelog, "pe_systemuserid", new MobileCRM.Reference(LLP.SystemUser.entityName, LLP.SystemUser.id, LLP.SystemUser.primaryName));
                return pe_rescotracelog;
            }

            return null;
        },
        CopyProperties: function (sourceEntity, targetEntity) {
            var propertyNames = Object.getOwnPropertyNames(sourceEntity.properties);
            var excludedProperties = ["propertyChanged", "_privChanged", "_typeInfo", "_privVals"];
            for (var i = 0; i < propertyNames.length; i++) {
                if (excludedProperties.indexOf(propertyNames[i]) >= 0) {
                    continue;
                }

                targetEntity.properties[propertyNames[i]] = sourceEntity.properties[propertyNames[i]];
            }

            return targetEntity;
        },
        GetEntityInfo: function (entity, defaultInfo) {
            if (!entity) {
                if (LLP.entityForm && LLP.entityForm.entity) {
                    return LLP.entityForm.entity.entityName + " | " + LLP.entityForm.entity.primaryName;
                }

                return defaultInfo;
            }

            return entity.entityName + " | " + entity.primaryName;
        }
    },
    Fetch: {
        GetChildRows: function (childEntityName, parentLookupAttributeName, parentId, attributesToGet, saveHandler, callback) {
            try {

                let attributes = '';
                for (let i = 0; i < attributesToGet.length; i++) {
                    attributes += '<attribute name="' + attributesToGet[i] + '" />';
                }

                var xml =
                    '<fetch>\
		                <entity name="' + childEntityName + '">' + attributes + '\
		                    <filter type="and">\
			                    <condition attribute="' + parentLookupAttributeName + '" operator="eq" value="' + parentId + '" />\
		                    </filter>\
		                </entity>\
	                </fetch>';

                MobileCRM.FetchXml.Fetch.deserializeFromXml(xml, function (fetch) {
                    fetch.execute("DynamicEntities", function (result) {
                        callback(result, saveHandler);
                    }, MobileCRM.bridge.alert);
                }, MobileCRM.bridge.alert);
            }
            catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Fetch.GetChildRows", e);
            }
        },
        IsAttributeValue: function (entity, attributeName, value, callback) {
            try {
                var xml =
                        '<fetch>\
		                    <entity name="' + entity.entityName + '">\
                                <attribute name="' + entity.entityName + 'id" />\
		                        <filter type="and">\
                                    <condition attribute="' + entity.entityName + 'id" operator="eq" value="' + entity.id + '" />\
			                        <condition attribute="' + attributeName + '" operator="eq" value="' + value + '" />\
		                        </filter>\
		                    </entity>\
	                    </fetch>';

                MobileCRM.FetchXml.Fetch.deserializeFromXml(xml, function (fetch) {
                    fetch.execute("DynamicEntities", function (result) {
                        callback(result.length > 0);
                    }, MobileCRM.bridge.alert);
                }, MobileCRM.bridge.alert);
            }
            catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Fetch.IsAttributeValue", e);
            }
        },
        IsAttributeValueIn: function (entity, attributeName, values, callback) {
            try {

                var valuesStr = "";
                for (var i = 0; i < values.length; i++) {
                    valuesStr += "<value>" + values[i] + "</value>";
                }

                var xml =
                        '<fetch>\
		                    <entity name="' + entity.entityName + '">\
                                <attribute name="' + entity.entityName + 'id" />\
		                        <filter type="and">\
                                    <condition attribute="' + entity.entityName + 'id" operator="eq" value="' + entity.id + '" />\
			                        <condition attribute="' + attributeName + '" operator="in">' + valuesStr + '</condition>\
		                        </filter>\
		                    </entity>\
	                    </fetch>';

                MobileCRM.FetchXml.Fetch.deserializeFromXml(xml, function (fetch) {
                    fetch.execute("DynamicEntities", function (result) {
                        callback(result.length > 0);
                    }, MobileCRM.bridge.alert);
                }, MobileCRM.bridge.alert);
            }
            catch (e) {
                LLP.LOG.Error("Error in GlobalCommonFunction.Fetch.IsAttributeValue", e);
            }
        }
    }
}