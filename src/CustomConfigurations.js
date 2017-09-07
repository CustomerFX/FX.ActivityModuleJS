/*
	Customer FX Activity Module
	See license and usage information at https://github.com/CustomerFX/FX.ActivityModule.JS

	Copyright (c) 2017 Customer FX Corporation
	http://customerfx.com
*/

define([
    'dojo/_base/lang'
],
function(
    lang
) {

    return {

        configurations: [
            {
                type: 'Lookup',
                entity: 'Widget',
                sort: ['WidgetName'],
                fields: [
                    { field: 'WidgetName', label: 'Widget' },
                    { field: 'Account.AccountName', label: 'Account' }
                ],
                seedProperty: 'Account.Id',
                parentContext: [
                    { entity: 'Account', id: 'AccountId', text: 'AccountName' }
                ],
                includeTabColumn: true
            },
            {
                type: 'Lookup',
                active: false,
                entity: 'AccountProduct',
                label: 'Product',
                fields: [
                    { field: 'ProductName', label: 'Product' },
                    { field: 'Account.AccountName', label: 'Account' }
                ],
                seedProperty: 'Account.Id',
                parentContext: [
                    { entity: 'Account', id: 'AccountId', text: 'AccountName' }
                ]
            }
        ]

    };

});
