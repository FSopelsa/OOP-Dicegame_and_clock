//--------------------------------------------------------------------------
// Public class
//--------------------------------------------------------------------------

/**
 *  Checks script tag and issues warnings if inline JavaScript was used or
 *  if external scripts do not confirm to standard naming conventions for classes 
 *  - with the name of the file corresponding to a class in the current scope.
 *  The file name should consist of the name of the class with no package
 *  identifiers in the name, i.e. MyClass.js is fine, but com.example.MyClass is 
 *  not supported. src = com/example/MyClass.js is supported. The code content 
 *  in the source file can contain package information, e.g. 
 *  com.example.MyClass = (function() {..}); Any package information included
 *  in this manner must be added (manually) to the configuration to make sure 
 *  the class is validated against the right scope.
 *  Also warns if any variables or function are added to the global scope 
 *  (the window object).
 *
 *  @version    1.6.0
 *  @copyright  Copyright (c) 2012-2016.
 *  @license    Creative Commons (BY-NC-SA)
 *  @since      Jan 11, 2016
 *  @author     Henrik Andersen <henrik.andersen@lnu.se>
 *              Emil Johansson <emil.johansson@lnu.se>
 */
com.vectorpanic.jsoop.system.Validator = (function(configs, console) {

    //----------------------------------------------------------------------
    // Strict mode
    //----------------------------------------------------------------------

    "use strict";

    //----------------------------------------------------------------------
    // Public constants
    //----------------------------------------------------------------------

    /**
     *  ...
     *
     *  @type {String}
     */
    this.MESSAGE_UNDEFINED_CLASS = "Class '%C' is imported but its object representation can not be found in the code base, please check that the class exists and is imported correctly.";

    /**
     *  ...
     *
     *  @type {String}
     */
    this.MESSAGE_INLINE_JAVASCRIPT = "Codebase contains script elements that advocate inline code, ie the src attribute is missing.";

    /**
     *  ...
     *
     *  @type {String}
     */
    this.MESSAGE_SCOPE_LEAKAGE = "Property '%P' was found in the global scope and does not relate to any class, assumed to be leakage.";

    /**
     *  ...
     *
     *  @type {String}
     */
    this.MESSAGE_UNDEFINED_PACKAGE = "Package '%P' is declared but not defined.";

    /**
     *  ...
     *
     *  @type {String}
     */
    this.MESSAGE_INVALID_PACKAGE = "Package '%P' is of invalid data type, use objects for package structures.";

    //----------------------------------------------------------------------
    // Internal properties
    //----------------------------------------------------------------------

    /**
     *  ...
     *
     *  @type {Array}
     */
    this.m_configs = configs || []; // Use empty array if configuration array supplied in constructor call is empty (or undefined or null)

    /**
     *  ...
     *
     *  @type {com.vectorpanic.jsoop.ui.Console}
     */
    this.m_console = console || new com.vectorpanic.jsoop.ui.Console(); // Use default console object if no valid console object was supplied in constructor call
    
    /**
     *  ...
     *
     *  @type {Array}
     */
    this.m_classes = [];
});

//--------------------------------------------------------------------------
// Public static methods
//--------------------------------------------------------------------------

/**
 *  Perform new check for inline javascript and scope leakage (addition of 
 *  attributes directly to the window object)
 *
 *  @return {undefined}
 */
com.vectorpanic.jsoop.system.Validator.prototype.refresh = function() {
    this.m_checkScriptFiles();
    this.m_checkObjectStructure();
};

//--------------------------------------------------------------------------
// Internal static methods
//--------------------------------------------------------------------------

/**
 *  Goes through all script elements and checks for inline javascript.
 *  For external javascript files (as indicated by the presence of a src attribute), these
 *  are sent for further processing.  
 *
 *  @return {undefined}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_checkScriptFiles = function() {
	var scripts = document.getElementsByTagName("script");
	for (var i = 0; i < scripts.length; i++) {
		if (scripts[i].src) this.m_registerClassFile(scripts[i].src); // External file - sent for processing
        else this.m_console.log(this.MESSAGE_INLINE_JAVASCRIPT, 0); // Inline JavaScript
	}
};

/**
 *  Uses the file name from the src attribute to check if there is a valid class declaration
 *  in the global scope corresponding to the name of the file (minus the file ending).
 *
 *  @path {String}  ...
 *
 *  @return {undefined}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_registerClassFile = function(path) {
	//@TODO: MAKE NICE
	var fn = path.split("/").pop(); // Get filename
    var cn = fn.split(".")[0]; // Remove extension to get class name
    if(this.m_classes.indexOf(cn) > -1) return; // If class name is already in list, no need to check it
    var cf = false; // Flag to indicate class found

    for (var i = 0; i < this.m_configs.length; i++) { // Run through the the previously registered configurations
        if (this.m_isClass(cn, this.m_configs[i].scope, this.m_configs[i].packages) === true || this.m_isExeption(cn) === true) { // Checks if script tag points to valid class or if class name is in list of exceptions (that should be skipped)
            cf = true;
            break;
        }
    }

    if (cf === true) this.m_classes.push(cn); // Adds the currently investigated class to the list of classes if passed the validation procedure
    else this.m_console.log(this.MESSAGE_UNDEFINED_CLASS.replace("%C", cn), 1); // If the class did not pass, an error is issued
};

/**
 *  Checks if name extracted from the src attribute for an external script element is a valid 
 *  class name.
 *
 *  @param {String} ...
 *  @param {Object} ...
 *  @param {Array}  ...
 *
 *  @return {undefined}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_isClass = function(name, scope, packages) {
	//@TODO: ...
    for (var i = 0; i < this.m_configs.length; i++) {
        if (packages == undefined || packages.length == 0) {    // If no package list or an empty package list was supplied
            if (typeof scope[name] !== "undefined") {           // and the class name is found 
                return true;                                    // then it is a valid class and this is indicated by returning true
            }
        } else { // If the packages list does contain entries
            for (var p = 0; p < packages.length; p++) { // Run through the list of packages
                if (scope[packages[p]] != undefined) {                              // For sub-packages that are indeed active underneath the current scope
                    if (scope[packages[p]].toString() == "[object Object]") {       // check that sub-package is of type [object Object], which it needs to function as a package container
                        if (typeof scope[packages[p]][name] !== "undefined") {      // check if the current sub-package contains an entry for the currently investigated class name
                            return true;                                            // and return true if it does (because this means that it is a valid entry with a file name corresponding to a class with the same name)
                        } 
                    } else { // If the sub-package is not the right type of object
                        this.m_console.log(this.MESSAGE_INVALID_PACKAGE.replace("%P", packages[p]), 1);
                    }
                } else { // If the package doesn't exist in the current scope
                    this.m_console.log(this.MESSAGE_UNDEFINED_PACKAGE.replace("%P", packages[p]), 1);
                }
            }
        }

        return false; // If all checks above have failed 
    }
};

/**
 *  Checks class name against list of exceptions (that are to be skipped).
 *
 *  @param {String} ...
 *
 *  @return {undefined}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_isExeption = function(name) {
	for (var i = 0; i < this.m_configs.length; i++) {
        if (this.m_configs[i].exceptions.indexOf(name) > -1) {
            return true;
        }
    }

    return false;
};

/**
 *  Checks if there is any object that it outside its scope.
 *  At the global level there should only be unpackaged class definitions.
 *  At every other level (as registered when running through the script elements),
 *  there should only be already registered classes. If there are 
 *
 *  @return {undefined}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_checkObjectStructure = function() {
    //@TODO: kontrollera om alias är object eller function?
    for (var i = 0; i < this.m_configs.length; i++) {
         var a = Object.getOwnPropertyNames(this.m_configs[i].scope); // Get names of all properties connected to the current scope
         var b = this.m_configs[i].original; // Original scope at creation time
         var c = this.m_diff(a, b); // Remove original list of properties that existed at creation time (any additional properties will be properties that have been added later)
         var d = this.m_diff(c, this.m_classes); // Remove registered classes
         var e = this.m_diff(d, this.m_getAliases()); // Remove aliases

        for (var j = 0; j < e.length; j++) { // If there are any entries left in e after removing the items this means that there has been scope leakage, i.e. that something has been added to the current scope in a way that violates the validation principles
            this.m_console.log(this.MESSAGE_SCOPE_LEAKAGE.replace("%P", e[j]), 2);
        }
    }
};

/**
 *  ...
 *
 *  @return {Array}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_getAliases = function() {
	var r = [];
    for (var i = 0; i < this.m_configs.length; i++) { // Get all aliases from all configurations
        r.push.apply(r, this.m_configs[i].aliases); 
    }

    return r;
};

/**
 *  ...
 *
 *  @param {Array} ...
 *  @param {Array} ...
 *
 *  @return {Array}
 */
com.vectorpanic.jsoop.system.Validator.prototype.m_diff = function(a1, a2) {
	return a1.filter(function(i) {return !(a2.indexOf(i) > -1);}); // Return filtered version of associative array a1 with items with corresponding entries in a2 removed
};