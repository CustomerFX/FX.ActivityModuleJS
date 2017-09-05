define([
    'dojo/_base/lang'
],
function(
    lang
) {

    return {

        configurations: [
            {
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
                active: false,
                entity: 'AccountProduct',
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
