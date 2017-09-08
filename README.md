# FX.ActivityModule.JS
A javascript library module that provides simple, configurable customization to the activity and history dialogs & tabs in Infor CRM Web. The library allows for customizations to be easily configured (in the [CustomConfigurations.js](https://github.com/CustomerFX/FX.ActivityModule.JS/blob/master/src/CustomConfigurations.js) file) or via declarative use by registering customizations at runtime.  

This works best using the [Customer FX Custom Loader Module](https://github.com/CustomerFX/FX.CustomLoader.Module). All you need to do is: 
1. Install the [bundle from the Customer FX Custom Loader Module](https://github.com/CustomerFX/FX.CustomLoader.Module/raw/master/Deliverables/Custom%20Loader%20Module.zip) 
2. Then, install the [FX.ActivityModule.JS Bundle](https://github.com/CustomerFX/FX.ActivityModule.JS/raw/master/Bundle%20for%20Custom%20Loader/FX.ActivityModule.JS.zip)
3. Then, add your customization configuration (see options below) to the [CustomConfigurations.js](https://github.com/CustomerFX/FX.ActivityModule.JS/blob/master/src/CustomConfigurations.js) file. 

## Registering Configured Customizations

Customizations can be configured in the [CustomConfigurations.js](https://github.com/CustomerFX/FX.ActivityModule.JS/blob/master/src/CustomConfigurations.js) file. This file simply returns an array of configuration objects that contain the options listed below. You can add configuration objects to this array and they will be automatically loaded at runtime. The configuration options available depend on the type of customization you are configuring. The General configuration options apply to all customization types. Refer to the list of options available for the specific type of customization, for example the Lookup type.   

### General Configuration Options

**`type`** *(required)*  
**Value:** "lookup", "picklist", "textbox", "datepicker", "checkbox", "config". This required value indicates the type of customization you are adding. The "config" type allows you to create a configuration that only uses the General options (mainly for using the `onAfterDialogCreate` and `onBeforeSave` callback functions).  

 **`id`**  
**Value:** The ID to use for the control. The ID will be automatically given a name if none included.   
**Default:** Based on configuration type, for example, for type "lookup", ID will be entity + "_lookup".   

**`label`**  
**Value:** The text label for the control.  
**Default:** Based on configuration type, for example, for type "lookup", the entity value will be used.  

**`active`**  
**Value:** true|false, indicating whether the customization is active or not. This allows you to easily turn off a customization while testing.  
**Default:** true  

**`container`**  
**Value:** "contactContainer", "regardingContainer", "leadContainer", "categoryContainer", "notesContainer", "datesContainer", "resultContainer". Indicates the container to add the control to.    
**Default:** Based on configuration type.  

**`includeTabColumn`**  
**Value:** true|false, indicating whether to add a column to the activity/history tab grids for the value. Note: if the type is "lookup" the column will be added as a hyperlink.    
**Default:** false  

**`onAfterDialogCreate`**  
**Value:** A callback function that fires after the dialog is created and receives one parameter of *config* (a reference to this configuration). The `this` context of the function will be the activity or history dialog itself. You can perform other optional logic to further customize the activity dialog in this function in this callback function.  
**Sample:** `function(config) {}`  

**`onBeforeSave`**  
**Value:** A callback function that fires before the dialog is closed and the record is saved that receives two parameters for *data* (the current data bound to the Activity or History dialog), and *config* (a reference to this configuration). The `this` context of the function will be the activity or history dialog itself. You can perform other optional logic, modify the data, etc in this callback function.  
**Sample:** `function(data, config) {}`  

**`onChange`**  
**Value:** A callback function that fires when the changes the value of the control that receives four parameters for *control* (the control that was changed), *value* (the value of the control), *data* (the current data bound to the Activity or History dialog), and *config* (a reference to this configuration). The `this` context of the function will be the activity or history dialog itself. You can perform other optional logic, modify the data, etc in this callback function.  
**Sample:** `function(control, value, data, config) {}`  

### Lookup Type Configuration Options   

**`entity`** *(required)*  
**Value:** The entity name the lookup is for.  
**Sample:** `'AccountProduct'`  
**Note:** This entity must have an ID and text field added to the Activity & History entities and tables. For example, if the entity is AccountProduct, you must add fields named AccountProductID and AccountProductName to the Activity & History entities (and tables). These properties need to be named based on the table for the entity, not the entity name. So, if the entity's table is named C_PROJECT, but the entity is named CProject, create these values as C_ProjectID and C_ProjectName, not CProjectID, etc. The ID property must be [entity physical table’s name + "Id"]. The case doesn't matter, but the fields do need to match the table name.  

**`fields`**  
**Value:** An array of fields you wish to display in the lookup dialog.  This is an array of objects with *field* and *label* properties.   
**Sample:** `[ {field: 'ProductName', label: 'Product'}, {field: 'Account.AccountName', label: 'Account'} ]`  

**`entityPath`**  
**Value:**  The SData path for the entity.   
**Sample:** `'accountProducts'`.  
**Default:** If not passed, plural entity value (lower case) will be assumed.  

**`select`**  
**Value:** An array of SData properties to retrieve for the lookup list dialog. This should correspond to the fields you are displaying in the lookup (Note: the select list will be derived from the fields option if not provided).      
**Sample:** `['ProductName', 'Account/AccountName']`   
**Default:** If no select option provided, it will be derived from the `fields` option.

**`include`**  
**Value:** An array of any additional SData entities to retrieve for the lookup list dialog. This should correspond to the properties in the select option (Note: the include list will be derived from the fields option if not provided).  
**Sample:** `[Account]`  
**Default:** If no include option provided, it will be derived from the `fields` option.  

**`sort`**  
**Value:** An array of properties to sort the records lookup dialog by.  
**Sample:** `['ProductName']`  
**Default:** None  

**`filters`**  
**Value:** An array of pre-filter objects (conditions) to add to the lookup results grid. The objects have four properties for *propertyName*, *conditionOperator*, *filterValue*, and *visible*.  
**Sample:** `[{propertyName: 'Status', conditionOperator: '=', filterValue: 'Test', visible: false}]`  
**Default:** None  

**`seedProperty`**  
**Value:** If the lookup results are limited by some other value (such as all account products for the selected account), you can set the seedProperty option with the property to limit the results by.  
**Sample:** `'Account.Id'`  
**Default:** None  

**`overrideSeedValueOnSearch`**  
**Value:** true|false, indicating whether the user can search or only be limited to the seed value (specified in the seedProperty option).  
**Default:** true 

**`allowClearingResult`**  
**Value:** true|false, indicating whether the user can clear the lookup value (it will show an "X" next to the magnifying glass icon)  
**Default:** true  

**`bind`**  
**Value:** An object containing two properties for *id* and *text*. The values for these properties must be the property names for the "ID" and "Name" properties on the Activity & History entities (see Note on entity option above).  
**Sample:** `{ id: 'AccountProductID', text: 'AccountProductName' }`  
**Default:** If not provided, this will be derived from the entity value provided as [entity + "ID"] and [entity + "Name"] respectively.  

**`parentContext`**  
**Value:** An array of objects with properties for *entity*, *id*, and *text*. This indicates other related entities to set when the current entity is set when the user opens the activity or history dialogs. For example, if you have an entity page for AccountProduct, and the user opens the activity or history dialog from that page, the current AccountProduct will be set. The parentContext arry indicates other related entities to also set. When the current AccountProduct is set when the dialog opens, you can specify to automatically set the AccountProduct's Account as well.  
**Sample:** `[{entity: 'Account', id: 'AccountId', text: 'AccountName'}]`  
**Default:** None  

**`onSetContext`**  
**Value:** A callback function that fires when the context is set for the current entity (when the user opens the dialog) that receives three parameters for *entity* (the record that was selected), *data* (the current data bound to the Activity or History dialog), and *config* (a reference to this configuration). The `this` context of the function will be the activity or history dialog itself. You can perform other optional logic, modify the data, etc in this callback function.  
**Sample:** `function(entity, data, config) {}`   

### Picklist Type Configuration Options

**`bind`** *(required)*    
**Value:** Property to bind the control to. This property must exist on the Activity and History entities    
**Sample:** `'SomeProperty`  
**Default:** None  

**`picklist`**   
**Value:** The name of the picklist to display   
**Sample:** `'Account Type`  
**Default:** None  

**`multiSelect`**   
**Value:** true|false, indicating whether the user can select a single item or multiple     
**Sample:** `'true`  
**Default:** false    

### Textbox Type Configuration Options

**`bind`** *(required)*    
**Value:** Property to bind the control to. This property must exist on the Activity and History entities    
**Sample:** `'SomeProperty`  
**Default:** None  

### Datepicker Type Configuration Options

**`bind`** *(required)*    
**Value:** Property to bind the control to. This property must exist on the Activity and History entities    
**Sample:** `'SomeProperty`  
**Default:** None  

### Checkbox Type Configuration Options

**`bind`** *(required)*    
**Value:** Property to bind the control to. This property must exist on the Activity and History entities    
**Sample:** `'SomeProperty`  
**Default:** None  

### Sample Configuration Object - Minimal  

```javascript
{
    type: 'lookup', 
    entity: 'AccountProduct',
    fields: [
        {field: 'ProductName', label: 'Product'},
        {field: 'Account.AccountName', label: 'Account'}
    ]
}
```  

### Sample Configuration Object - All Options  

```javascript
{
    type: 'lookup', 
    entity: 'Widget',
    id: 'widgetLookup', /* optional - derive from entity */
    label: 'Widget', /* optional - derive from entity */
    active: true, /* optional - default true */ 
    container: 'contactContainer', /* optional */
    includeTabColumn: false, /* optional - default false */
    entityPath: 'widgets', /* optional - derive from entity */
    select: ['WidgetName', 'Account/AccountName'], /* optional - derive from fields*/
    include: ['Account'], /* optional - derive from fields */
    sort: ['WidgetName'], /* optional */
    fields: [
        {field: 'WidgetName', label: 'Widget'},
        {field: 'Account.AccountName', label: 'Account'}
    ],
    filters: [], /* optional */
    seedProperty: 'Account.Id', /* optional */
    overrideSeedValueOnSearch: false, /* optional - default true */
    allowClearingResult: true, /* optional - default true */ 
    bind: {id: 'WidgetID', text: 'WidgetName'}, /* optional - derive from entity */
    parentContext: [ /* optional */
        {entity: 'Account', id: 'AccountId', text: 'AccountName'}
    ],
    onSetContext: function(entity, data, config) {} /* optional - "this" is dialog */
    onBeforeSave: function(data, config) {}, /* optional - "this" is dialog /* 
    onAfterDialogCreate: function(config) {}, /* optional - "this" is dialog, callback after dialog postCreate 
    onChange: function(control, value, data, config) {} /* "this" is dialog  */
} 
```  

**Simply add the objects, like the ones above, to the CustomConfigurations.configurations array and the magic will happen, automatically, at runtime.**    

Once you have the configuration object constructed, you'll add it to the [CustomConfigurations.js](https://github.com/CustomerFX/FX.ActivityModule.JS/blob/master/src/CustomConfigurations.js) file. The with with some sample configurations would look like this:  

```javascript   
// This is a sample CustomConigurations file with two registered lookups to add to the activity & history dialogs
define([
    'dojo/_base/lang'
],
function(
    lang
) {

    return {

        configurations: [
            {
                type: 'lookup',
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
                type: 'lookup',
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
        ];

    };

});
```

## Registering Declarative Customizations  

You can also register customizations as runtime as well, instead of adding them to the [CustomConfigurations.js](https://github.com/CustomerFX/FX.ActivityModule.JS/blob/master/src/CustomConfigurations.js) file. To do this, simply create a configuration object as shown above, and pass it to the `registerCustomization` function of the ActivityModule. See sample below:  

```javascript 
require([
    'FXActivity/ActivityModule',
],
function(activityModule) {

    // Add account product lookup 
    
    activityModule.registerCustomization({
        type: 'lookup', 
        entity: 'AccountProduct',
        label: 'Product ', 
        fields: [
            {field: 'ProductName', label: 'Product'},
            {field: 'Account.AccountName', label: 'Account'}
        ],
        seedProperty: 'Account.Id',
        parentContext: [
            {entity: 'Account', id: 'AccountId', text: 'AccountName'}
        ]
    });
    
    // add widget entity lookup 
    
    // create configuration object
    var config = {
        type: 'lookup', 
        entity: 'Widget',
        fields: [
            {field: 'WidgetName', label: 'Widget'},
            {field: 'Account.AccountName', label: 'Account'}
        ]
    };
    
    // register it 
    activityModule.registerCustomization(config);

});
```   

While adding your customizations to the [CustomConfigurations.js](https://github.com/CustomerFX/FX.ActivityModule.JS/blob/master/src/CustomConfigurations.js) file is the recommended approach, declaratively registering customizations will allow you to conditionally add customizations if needed.  

**The following is a sample showing many different types of customizations that were added with this library :thumbsup: :boom:   
<img src="http://content.screencast.com/users/RyanFarley/folders/Default/media/1ab69451-35d8-472e-bf24-3378517edff5/ActivityModule_SampleWithMany.png">

