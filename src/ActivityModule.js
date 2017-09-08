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
    'Sage/MainView/ActivityMgr/ActivityEditor',
    'Sage/MainView/ActivityMgr/HistoryEditor',
    'Sage/Services/ActivityService',
    'Sage/UI/ActivityList',
    'Sage/UI/NotesHistoryList',
    'Sage/Data/SingleEntrySDataStore',
    'Sage/Data/SDataServiceRegistry',
    'Sage/UI/Controls/Lookup',
    'Sage/UI/Controls/GridParts/Columns/SlxLink',
    'FXActivity/CustomConfigurations'
],
function (
    declare,
    lang,
    connector,
    aspect,
    domConstruct,
    ActivityEditor,
    HistoryEditor,
    ActivityService,
    ActivityList,
    NotesHistoryList,
    SingleEntrySDataStore,
    SDataServiceRegistry,
    Lookup,
    ColumnLink,
    CustomConfigurations
) {
    var __activityModule = declare('FXActiviy.ActivityModule', null, {

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
                _editor_createLookup: this._editor_createLookup,
                _editor_resetContainerLookups: this._editor_resetContainerLookups
            });
            aspect.after(ActivityEditor.prototype, '_ensureLookupsCreated', this._createEditorControls);
            aspect.after(ActivityEditor.prototype, '_manualBind', this._manualBind);
            aspect.after(ActivityEditor.prototype, '_updateLookupSeedValues', this._updateLookupSeedValues);
            aspect.before(ActivityEditor.prototype, '_saveAndClose', this._activitySave);
        },

        _setupHistoryEditor: function() {
            HistoryEditor.prototype._activityModule = this;
            lang.extend(HistoryEditor, {
                _editor_acitivityModuleControls: [],
                _editor_createLookup: this._editor_createLookup,
                _editor_resetContainerLookups: this._editor_resetContainerLookups
            });
            aspect.after(HistoryEditor.prototype, 'createAccountLookup', this._createEditorControls);
            aspect.after(HistoryEditor.prototype, '_manualBind',this. _manualBind);
            aspect.after(HistoryEditor.prototype, '_updateLookupSeedValues', this._updateLookupSeedValues);
            aspect.before(HistoryEditor.prototype, '_okClick', this._historySave);
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
                    if (!this._service_getLookupDefaultContext(activityService, showEditor))
                        showEditor();
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

            switch (config.type) {
                case 'lookup':
                    this.registerLookup(config);
                    break;
                default:
                    throw new Error('Invalid configuration type "' + config.type + '". Valid types are: Lookup.');
            }
        },

        registerLookup: function(config) {
            config.type = 'lookup';
            this._validateConfig(config);

            if (!config.active)
                return;

            console.log('FX: Activity/history customization registered for ' + config.entity);
            this.configurations.push(config);
        },

        _validateConfig: function(config) {
            switch (config.type) {
                case 'lookup':
                    if (!config.hasOwnProperty('entity'))
                        throw new Error('Configuration is not valid for Lookup. Missing entity');
                    if (!config.hasOwnProperty('fields') || config.fields.constructor !== Array || config.fields.length < 1)
                        throw new Error('Configuration is not valid for Lookup. Missing fields');

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
                    this._setConfigValue(config, 'includeTabColumn', false);
                    this._setConfigValue(config, 'active', true);
                    this._setConfigValue(config, 'container', 'contactContainer');
                    break;
            }
        },

        _setConfigValue(config, key, defaultValue) {
            if (!config.hasOwnProperty(key)) {
                config[key] = defaultValue;
            }
        },

        _manualBind: function() {
            // if no lookups created
            if ((this._editor_acitivityModuleControls || []).length === 0)
                return;

            this._isBinding = true;
            var data = this._activityData || this._historyData;

            this._editor_acitivityModuleControls.forEach(function(control) {

                switch (control.declaredClass) {
                    case 'Sage.UI.Controls.Lookup':
                        var name = data[control._activityModuleConfig.bind.text];
                        if (!name && data.Details && data.Details[control._activityModuleConfig.bind.text])
                            name = data.Details[control._activityModuleConfig.bind.text];

                        control.set('selectedObject', data[control._activityModuleConfig.bind.id] ? {
                            $key: data[control._activityModuleConfig.bind.id],
                            $descriptor: name
                        } : null);
                        break;
                }
            }, this);

            this._isBinding = false;
        },

        _updateLookupSeedValues: function(newSeed) {
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

        _createEditorControls: function() {
            // if already created controls
            if ((this._editor_acitivityModuleControls || []).length > 0)
                return;
            // if no controls to create
            if ((this._activityModule.configurations || []).length === 0)
                return;

            // create controls
            this._activityModule.configurations.forEach(function(config) {
                var control = null;
                switch (config.type) {
                    case 'lookup':
                        control = this._editor_createLookup.call(this, config);
                        break;
                }

                if (control != null) this._editor_acitivityModuleControls.push(control);
            }, this);

            if (this._editor_acitivityModuleControls.length > 0) {
                // TODO: determine control type and add to appropriate container
                this._editor_resetContainerLookups(this.contactContainer, this._editor_acitivityModuleControls);
            }
        },

        _activitySave: function() {
            this._activityModule.configurations.forEach(function(config) {
                if (config.type == 'lookup') {
                    if (this._activityData && this._activityData.Details)
                        this._activityData.Details[config.bind.text] = this._activityData[config.bind.text];
                }

                if (config.hasOwnProperty('onBeforeSave') && typeof config.onBeforeSave === 'function') {
                    config.onBeforeSave.call(this, this._activityData, config);
                }
            }, this);
        },

        _historySave: function() {
            this._activityModule.configurations.forEach(function(config) {
                if (config.hasOwnProperty('onBeforeSave') && typeof config.onBeforeSave === 'function') {
                    config.onBeforeSave.call(this, this._historyData, config);
                }
            }, this);
        },

        _editor_createLookup: function(config) {
            var lookupConfig = {
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
            };

            var lookup = new Lookup({
                id: config.id,
                allowClearingResult: config.allowClearingResult,
                label: config.label,
                readonly: true,
                config: lookupConfig
            });
            lookup.textbox.required = false;

            this.eventConnections.push(connector.connect(lookup, 'onChange',
                lang.hitch(this, function(config, selection) {
                    if (this._isBinding)
                        return;

                    var data = this._activityData || this._historyData;
                    if (selection) {
                        data[config.bind.id] = selection.$key;
                        data[config.bind.text] = selection.$descriptor;
                    }
                    else {
                        data[config.bind.id] = null;
                        data[config.bind.text] = null;
                    }

                    if (config.hasOwnProperty('onLookupSelect') && typeof config.onLookupSelect === 'function') {
                        config.onLookupSelect.call(this, selection, data, config);
                    }
                }, config)
            ));

            lookup._activityModuleConfig = config;
            return lookup;
        },

        _editor_resetContainerLookups: function(container, lookups) {
            for (var i = 0; i < lookups.length; i++) {
                var lup = lookups[i];
                var div = new dijit.layout.ContentPane({
                    class: 'remove-padding lookup-container',
                    label: lup.label
                });
                domConstruct.place(lup.domNode, div.domNode, 'only');
                container.addChild(div);
            }
            // force restart
            container._initialized = false;
            container._started = false;
            container.startup();
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
                if (config.type == 'lookup' && config.includeTabColumn) {
                    options.storeOptions.select.push(config.bind.id);
    				options.storeOptions.select.push(config.bind.text);

                    if (this.tabId == 'ActivityList')
                        options.storeOptions.select.push('Details/' + config.bind.text);

                    options.columns.push({
                        field: (this.tabId == 'ActivityList' ? 'Details.' : '') + config.bind.text,
                        label: config.label,
                        width: '100px',
                        type: ColumnLink,
                        idField: config.bind.id,
                        pageName: config.entity
                    });
                }
            }, this);
        }

    });

	return new __activityModule();
});
