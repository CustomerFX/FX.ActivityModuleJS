/*
	Customer FX Activity Module
	See license and usage information at https://github.com/CustomerFX/FX.ActivityModule.JS

	Copyright (c) 2017 Customer FX Corporation
	http://customerfx.com
*/

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/aspect',
    'dojo/dom-construct',
    'Sage/Utility',
    'Sage/MainView/ActivityMgr/ActivityEditor',
    'Sage/MainView/ActivityMgr/HistoryEditor',
    'Sage/Services/ActivityService',
    'Sage/UI/ActivityList',
    'Sage/UI/NotesHistoryList',
    'Sage/Data/SingleEntrySDataStore',
    'Sage/Data/SDataServiceRegistry',
    'Sage/UI/Controls/TextBox',
    'Sage/UI/Controls/Lookup',
    'Sage/UI/Controls/SingleSelectPickList',
    'Sage/UI/Controls/MultiSelectPickList',
    'Sage/UI/Controls/DateTimePicker',
    'Sage/UI/Controls/CheckBox',
    'Sage/UI/Controls/GridParts/Columns/SlxLink',
    'Sage/UI/Controls/GridParts/Columns/DateTime',
    'Sage/UI/Controls/GridParts/Columns/CheckBox',
    'FXActivity/CustomConfigurations'
],
function (
    declare,
    lang,
    connector,
    aspect,
    domConstruct,
    utility,
    ActivityEditor,
    HistoryEditor,
    ActivityService,
    ActivityList,
    NotesHistoryList,
    SingleEntrySDataStore,
    SDataServiceRegistry,
    TextBox,
    Lookup,
    SingleSelectPickList,
    MultiSelectPickList,
    DateTimePicker,
    CheckBox,
    ColumnLink,
    ColumnDate,
    ColumnCheck,
    CustomConfigurations
) {
    var __activityModule = declare('FXActiviy.ActivityModule', null, {

        _validConfigTypes: ['lookup', 'picklist', 'textbox', 'datepicker', 'checkbox', 'config'],
        _validContainers: ['contactContainer', 'regardingContainer', 'leadContainer', 'categoryContainer', 'notesContainer', 'resultContainer', 'datesContainer'],

        configurations: [],

        constructor: function() {
            this._setupActivityEditor();
            this._setupHistoryEditor();
            this._setupActivityService();
            this._setupActivityList();
            this._setupHistoryList();

            // load CustomConfigurations
            CustomConfigurations.configurations.forEach(function(config) {
                this.registerCustomization(config);
            }, this);
        },

        _setupActivityEditor: function() {
            ActivityEditor.prototype._activityModule = this;
            lang.extend(ActivityEditor, {
                _editor_acitivityModuleControls: [],
                _editor_createControl: this._editor_createControl,
                _editor_onControlChange: this._editor_onControlChange,
                _editor_addContainerControls: this._editor_addContainerControls
            });
            aspect.after(ActivityEditor.prototype, '_ensureLookupsCreated', this._editor_ensureControlsCreated);
            aspect.after(ActivityEditor.prototype, '_manualBind', this._editor_manualBind);
            aspect.after(ActivityEditor.prototype, '_updateLookupSeedValues', this._editor_updateLookupSeedValues);
            aspect.before(ActivityEditor.prototype, '_saveAndClose', this._editor_activitySave);
            aspect.after(ActivityEditor.prototype, 'postCreate', function() {
                this._activityModule.configurations.forEach(function(config) {
                    if (config.hasOwnProperty('onAfterDialogCreate') && typeof config.onAfterDialogCreate === 'function') {
                        config.onAfterDialogCreate.call(this, config);
                    }
                }, this);
            });
        },

        _setupHistoryEditor: function() {
            HistoryEditor.prototype._activityModule = this;
            lang.extend(HistoryEditor, {
                _editor_acitivityModuleControls: [],
                _editor_createControl: this._editor_createControl,
                _editor_onControlChange: this._editor_onControlChange,
                _editor_addContainerControls: this._editor_addContainerControls
            });
            aspect.after(HistoryEditor.prototype, 'createAccountLookup', this._editor_ensureControlsCreated);
            aspect.after(HistoryEditor.prototype, '_manualBind',this. _editor_manualBind);
            aspect.after(HistoryEditor.prototype, '_updateLookupSeedValues', this._editor_updateLookupSeedValues);
            aspect.before(HistoryEditor.prototype, '_okClick', this._editor_historySave);
            aspect.after(HistoryEditor.prototype, 'postCreate', function() {
                this._activityModule.configurations.forEach(function(config) {
                    if (config.hasOwnProperty('onAfterDialogCreate') && typeof config.onAfterDialogCreate === 'function') {
                        config.onAfterDialogCreate.call(this, config);
                    }
                }, this);
            });
        },

        _setupActivityService: function() {
            ActivityService.prototype._activityModule = this;
            lang.extend(ActivityService, {
                _service_getLookupDefaultContext: this._service_getLookupDefaultContext,
                _service_getEntityContext: this._service_getEntityContext

            });
            aspect.around(ActivityService.prototype, 'getActivityEntityContext', function(originalMethod) {
                return function(scope, callback) {
                    return this._service_getLookupDefaultContext(scope, callback) || originalMethod.call(this, scope, callback);
                }
            });

            aspect.around(ActivityService.prototype, 'completeNewActivity', function(originalMethod) {
                return function(type, args) {
                    var activityService = this;
                    var showEditor = function(scope, context) {
                        if (context) {
                            lang.mixin(args, context);
                        }
                        originalMethod.call(activityService, type, args);
                    }
                    if (!this._service_getLookupDefaultContext(activityService, showEditor)) {
                        showEditor();
                    }
                }
            });
        },

        _setupActivityList: function() {
            ActivityList.prototype._activityModule = this;
            aspect.before(ActivityList.prototype, 'onBeforeCreateGrid', this._list_onBeforeCreateGrid);
        },

        _setupHistoryList: function() {
            NotesHistoryList.prototype._activityModule = this;
            aspect.before(NotesHistoryList.prototype, 'onBeforeCreateGrid', this._list_onBeforeCreateGrid);
        },

        registerCustomization: function(config) {
            if (!config.hasOwnProperty('type'))
                throw new Error('Configuration is not valid. Missing "type"');

            config.type = config.type.toLowerCase();
            if (this._validConfigTypes.indexOf(config.type) === -1) {
                throw new Error('Invalid configuration type "' + config.type + '". Valid types are "' + this._validConfigTypes.join('", "') + '".');
            }

            this._validateConfig(config);
            if (!config.active)
                return;

            // register type:config callbacks
            if (config.type == 'config' && config.callbacks.length) {
                config.callbacks.forEach(function(callback) {
                    if (ActivityEditor.prototype[callback.function])
                        aspect[callback.when].apply(this, [ActivityEditor.prototype, callback.function, callback.execute, true]);
                    if (HistoryEditor.prototype[callback.function])
                        aspect[callback.when].apply(this, [HistoryEditor.prototype, callback.function, callback.execute, true]);
                }, this);
            }

            console.log('[FX] Activity/history ' + config.type + ' customization registered. (c) 2017 customerfx.com');
            this.configurations.push(config);
        },

        _validateConfig: function(config) {
            // validate general config options
            this._setConfigValue(config, 'active', true);
            this._setConfigValue(config, 'includeTabColumn', false);

            // validate specific type coonfig options
            switch (config.type) {
                case 'lookup':
                    if (!config.hasOwnProperty('entity'))
                        throw new Error('Configuration is not valid for lookup. Missing entity property');
                    if (!config.hasOwnProperty('fields') || config.fields.constructor !== Array || config.fields.length < 1)
                        throw new Error('Configuration is not valid for lookup. Missing fields property');

                    this._setConfigValue(config, 'id', config.entity + '_lookup');
                    this._setConfigValue(config, 'label', config.entity);
                    this._setConfigValue(config, 'entityPath', config.entity.toLowerCase() + 's');
                    this._setConfigValue(config, 'bind', {id: config.entity + 'ID', text: config.entity + 'Name'});
                    this._setConfigValue(config, 'select', config.fields.map(function(entry) { return entry.field.replace('.', '/'); }));
                    this._setConfigValue(config, 'include', config.select.filter(function(entry) { return entry.indexOf('/') > -1; }).map(function(entry) { return entry.substr(0, entry.indexOf('/')); }));
                    this._setConfigValue(config, 'filters', []);
                    this._setConfigValue(config, 'parentContext', []);
                    this._setConfigValue(config, 'overrideSeedValueOnSearch', true);
                    this._setConfigValue(config, 'allowClearingResult', true);
                    this._setConfigValue(config, 'container', 'contactContainer');
                    break;
                case 'picklist':
                    if (!config.hasOwnProperty('bind'))
                        throw new Error('Configuration is not valid for picklist. Missing bind property');
                    if (!config.hasOwnProperty('picklist'))
                        throw new Error('Configuration is not valid for picklist. Missing picklist property');

                    this._setConfigValue(config, 'multiSelect', false);
                    this._setConfigValue(config, 'id', config.bind + '_picklist');
                    this._setConfigValue(config, 'label', config.bind);
                    this._setConfigValue(config, 'container', 'regardingContainer');
                    break;
                case 'textbox':
                    if (!config.hasOwnProperty('bind'))
                        throw new Error('Configuration is not valid for textbox. Missing bind property');

                    this._setConfigValue(config, 'id', config.bind + '_textbox');
                    this._setConfigValue(config, 'label', config.bind);
                    this._setConfigValue(config, 'container', 'regardingContainer');
                    break;
                case 'datepicker':
                    if (!config.hasOwnProperty('bind'))
                        throw new Error('Configuration is not valid for datepicker. Missing bind property');

                    this._setConfigValue(config, 'id', config.bind + '_datepicker');
                    this._setConfigValue(config, 'label', config.bind);
                    this._setConfigValue(config, 'container', 'datesContainer');
                    break;
                case 'checkbox':
                    if (!config.hasOwnProperty('bind'))
                        throw new Error('Configuration is not valid for checkbox. Missing bind property');

                    this._setConfigValue(config, 'id', config.bind + '_checkbox');
                    this._setConfigValue(config, 'label', config.bind);
                    this._setConfigValue(config, 'container', 'regardingContainer');
                    break;
                case 'config':
                    this._setConfigValue(config, 'callbacks', []);
                    config.includeTabColumn = false;
                    break;
            }

            if (config.container && this._validContainers.indexOf(config.container) === -1) {
                throw new Error('Invalid container "' + config.container + '". Valid containers are "' + this._validContainers.join('", "') + '".');
            }
        },

        _setConfigValue(config, key, defaultValue) {
            if (!config.hasOwnProperty(key)) {
                config[key] = defaultValue;
            }
        },

        _editor_ensureControlsCreated: function() {
            // if already created controls
            if ((this._editor_acitivityModuleControls || []).length > 0)
                return;
            // if no controls to create
            if ((this._activityModule.configurations || []).length === 0)
                return;

            // create controls
            this._activityModule.configurations.forEach(function(config) {
                if (config.type != 'config') {
                    this._editor_acitivityModuleControls.push(this._editor_createControl.call(this, config));
                }
            }, this);

            // add to containers
            if (this._editor_acitivityModuleControls.length > 0) {
                this._activityModule._validContainers.forEach(function(container) {
                    var controls = this._editor_acitivityModuleControls.filter(function(ctrl) { return ctrl._activityModuleConfig.container == container; });
                    if (controls.length > 0) {
                        if (container == 'datesContainer') container = 'dateSection_AddEdit';
                        this._editor_addContainerControls(this[container], controls);
                    }
                }, this);
            }
        },

        _editor_createControl: function(config) {
            // get control type
            var controlType = null;
            switch (config.type) {
                case 'lookup': controlType = Lookup; break;
                case 'picklist': controlType = config.multiSelect ? MultiSelectPickList : SingleSelectPickList; break;
                case 'textbox': controlType = TextBox; break;
                case 'datepicker': controlType = DateTimePicker; break;
                case 'checkbox': controlType = CheckBox; break;
            }

            // create control 
            var control = new controlType({
                id: this.id + '-' + config.id,
                label: config.label
            });

            // set picklist specific properties
            if (config.type == 'picklist') {
                control.set('pickListName', config.picklist);
            }

            // set lookup specific properties
            if (config.type == 'lookup') {
                control.set('allowClearingResult', config.allowClearingResult);
                control.set('readonly', true);
                control.textbox.required = false;
                control.set('config', {
                    isModal: true,
                    id: config.id + '_config',
                    displayMode: 'Dialog',
                    storeOptions: {
                        resourceKind: config.entityPath,
                        select: config.select,
                        sort: config.sort
                    },
                    structure: config.fields,
                    gridOptions: {
                        contextualCondition: '',
                        contextualShow: '',
                        selectionMode: 'single'
                    },
                    preFilters: config.filters,
                    seedProperty: config.seedProperty,
                    overrideSeedValueOnSearch: config.overrideSeedValueOnSearch,
                    dialogTitle: 'Select ' + config.label,
                    dialogButtonText: 'OK'
                });
            }

            // wire up change event
            this.eventConnections.push(connector.connect(control, 'onChange', lang.hitch(this, this._editor_onControlChange, control, config)));

            control._activityModuleConfig = config;
            return control;
        },

        _editor_addContainerControls: function(container, controls) {
            controls.forEach(function(control) {
                var div = new dijit.layout.ContentPane({
                    class: 'remove-padding ' + control._activityModuleConfig.type + '-container ' +  control._activityModuleConfig.type,
                    style: 'overflow: hidden;',
                    label: control._activityModuleConfig.label
                });
                domConstruct.place(control.domNode, div.domNode, 'only');
                container.addChild(div);
            }, this);

            // force restart container
            container._initialized = false;
            container._started = false;
            container.startup();
        },

        _editor_onControlChange: function(control, config, selection) {
            if (this._isBinding)
                return;

            var data = this._activityData || this._historyData;

            switch (config.type) {
                case 'lookup':
                    if (selection) {
                        data[config.bind.id] = selection.$key;
                        data[config.bind.text] = selection.$descriptor;
                    }
                    else {
                        data[config.bind.id] = null;
                        data[config.bind.text] = null;
                    }
                    break;
                case 'checkbox':
                    var checked = control.get('value');
                    data[config.bind] = (checked === 'on');
                    break;
                default:
                    data[config.bind] = control.get('value');
            }

            if (config.hasOwnProperty('onChange') && typeof config.onChange === 'function') {
                var selectedValue = config.type == 'lookup' ? selection : control.get('value');
                config.onChange.call(this, control, selectedValue, data, config);
            }
        },

        _editor_manualBind: function() {
            // if no controls created
            if ((this._editor_acitivityModuleControls || []).length === 0)
                return;

            this._isBinding = true;
            var data = this._activityData || this._historyData;

            this._editor_acitivityModuleControls.forEach(function(control) {
                switch (control._activityModuleConfig.type) {
                    case 'lookup':
                        var name = data[control._activityModuleConfig.bind.text];
                        if (!name && data.Details && data.Details[control._activityModuleConfig.bind.text])
                            name = data.Details[control._activityModuleConfig.bind.text];

                        control.set('selectedObject', data[control._activityModuleConfig.bind.id] ? {
                            $key: data[control._activityModuleConfig.bind.id],
                            $descriptor: name
                        } : null);
                        break;
                    default:
                        var value = data[control._activityModuleConfig.bind];
                        if (!value && data.Details && data.Details[control._activityModuleConfig.bind])
                            value = data.Details[control._activityModuleConfig.bind];

                        if (value && control._activityModuleConfig.type == 'datepicker')
                            value = utility.Convert.toDateFromString(value);

                        control.set('value', value || null);
                        if (!value) {
                            control.reset && control.reset();
                        }
                }
            }, this);

            this._isBinding = false;
        },

        _editor_updateLookupSeedValues: function(newSeed) {
            if ((this._editor_acitivityModuleControls || []).length === 0)
                return;

            var accId = newSeed || (this._activityData || this._historyData).AccountId;
            this._editor_acitivityModuleControls.forEach(function(control) {
                if (control.declaredClass == 'Sage.UI.Controls.Lookup') {
                    if (control.config.seedProperty)
                        control.config.seedValue = accId;
                }
            }, this);
        },

        _service_getLookupDefaultContext: function(scope, callback) {
            // if no registered configurations
            if (scope._activityModule.configurations.length === 0)
                return;

            var contextService = Sage.Services.getService('ClientEntityContext');
            if (!contextService) return false;

            var entityContext = contextService.getContext();
            if (!entityContext) return false;

            var hasContext = false;
            scope._activityModule.configurations.forEach(function(config) {
                if (entityContext.EntityType == 'Sage.Entity.Interfaces.I' + config.entity) {
                    this._service_getEntityContext(config, entityContext, scope, callback);
                    hasContext = true;
                }
            }, this);

            return hasContext;
        },

        _editor_activitySave: function() {
            this._activityModule.configurations.forEach(function(config) {
                if (this._activityData && this._activityData.Details) {
                    var bindField = config.type == 'lookup' ? config.bind.text : config.bind;
                    this._activityData.Details[bindField] = this._activityData[bindField];
                }

                if (config.hasOwnProperty('onBeforeSave') && typeof config.onBeforeSave === 'function') {
                    config.onBeforeSave.call(this, this._activityData, config);
                }
            }, this);
        },

        _editor_historySave: function() {
            this._activityModule.configurations.forEach(function(config) {
                if (config.hasOwnProperty('onBeforeSave') && typeof config.onBeforeSave === 'function') {
                    config.onBeforeSave.call(this, this._historyData, config);
                }
            }, this);
        },

        _service_getEntityContext: function(config, entityContext, scope, callback) {
            var context = {
                AccountId: null,
                AccountName: null,
                ContactId: null,
                ContactName: null,
                OpportunityId: null,
                OpportunityName: null,
                PhoneNumber: null
            };

            context[config.bind.id] = null;
            context[config.bind.text] = null;

            var store = new SingleEntrySDataStore({
                resourceKind: config.entityPath,
                select: config.parentContext.map(function(entry) { return entry.entity + '/' + entry.text; }),
                include: config.parentContext.map(function(entry) { return entry.entity; }),
                service: SDataServiceRegistry.getSDataService('dynamic')
            });
            store.fetch({
                predicate: '"' + entityContext.EntityId + '"',
                onComplete: function(entry) {
                    context[config.bind.id] = entry.$key;
                    context[config.bind.text] = entry.$descriptor;

                    for (var i = 0; i < config.parentContext.length; i++) {
                        var parent = config.parentContext[i];
                        context[parent.id] = entry[parent.entity]['$key'];
                        context[parent.text] = entry[parent.entity][parent.text];
                    }

                    if (config.hasOwnProperty('onSetContext') && typeof config.onSetContext === 'function') {
                        config.onSetContext.call(scope, selection, data, config);
                    }

                    if (callback) {
                        callback(scope, context);
                    }
                },
                onError: function() {
                    if (callback) {
                        callback(scope, context);
                    }
                },
                scope: this
            });
        },

        _list_onBeforeCreateGrid: function(options) {
            this._activityModule.configurations.forEach(function(config) {
                if (!config.includeTabColumn) return;

                // set up store fields
                var bindField = config.bind;
                if (config.type == 'lookup') {
                    options.storeOptions.select.push(config.bind.id);
                    bindField = config.bind.text;
                }
                options.storeOptions.select.push(bindField);
                if (this.tabId == 'ActivityList')
                    options.storeOptions.select.push('Details/' + bindField);

                switch (config.type) {
                    case 'lookup':
                        // only show for lookup types if not viewing the entity
                        var entityType = Sage.Services.getService('ClientEntityContext').getContext().EntityType;
                        if (entityType != 'Sage.Entity.Interfaces.I' + config.entity) {
                            options.columns.push({
                                field: (this.tabId == 'ActivityList' ? 'Details.' : '') + config.bind.text,
                                label: config.label,
                                width: '100px',
                                type: ColumnLink,
                                idField: config.bind.id,
                                pageName: config.entity
                            });
                        }
                        break;
                    case 'datepicker':
                        options.columns.push({
                            field: (this.tabId == 'ActivityList' ? 'Details.' : '') + config.bind,
                            label: config.label,
                            type: ColumnDate,
                            dateOnly: false
                        });
                        break;
                    case 'checkbox':
                        options.columns.push({
                            field: (this.tabId == 'ActivityList' ? 'Details.' : '') + config.bind,
                            label: config.label,
                            editor: ColumnCheck,
                            editorArgs: {
                                disabled: true
                            }
                        });
                        break;
                    default:
                        options.columns.push({
                            field: (this.tabId == 'ActivityList' ? 'Details.' : '') + config.bind,
                            label: config.label
                        });
                }
            }, this);
        }

    });

	return new __activityModule();
});
