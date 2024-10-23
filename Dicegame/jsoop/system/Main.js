//--------------------------------------------------------------------------
// Public class
//--------------------------------------------------------------------------

/**
 *  ...
 *
 *  @version    1.6.0
 *  @copyright  Copyright (c) 2012-2016.
 *  @license    Creative Commons (BY-NC-SA)
 *  @since      Jan 11, 2016
 *  @author     Henrik Andersen <henrik.andersen@lnu.se>
 *              Emil Johansson <emil.johansson@lnu.se>
 */
com.vectorpanic.jsoop.system.Main = (function() {

    //----------------------------------------------------------------------
    // Strict mode
    //----------------------------------------------------------------------

    "use strict";

    //----------------------------------------------------------------------
    // Public scope
    //----------------------------------------------------------------------

    /**
     *  ...
     * 
     *  @type {Object}
     */
    var m_this = {};

    //----------------------------------------------------------------------
    //  Private properties
    //----------------------------------------------------------------------

    /**
     *  ...
     * 
     *  @type {Array}
     */
    var m_classes = [];

    /**
     *  ...
     * 
     *  @type {Array}
     */
    var m_configs = [new com.vectorpanic.jsoop.system.Config()]; // A default config is added at initialisation (this will point to the window object by default)

    /**
     *  ...
     * 
     *  @type {com.vectorpanic.jsoop.console.Console}
     */
    var m_console = null;

    /**
     *  ...
     * 
     *  @type {com.vectorpanic.jsoop.system.Validator}
     */
    var m_validator = null;

    /**
     *  ...
     * 
     *  @type {Boolean}
     */
    var m_validationCompromised = false;

    //----------------------------------------------------------------------
    //  Private constants
    //----------------------------------------------------------------------

    /**
     *  ...
     * 
     *  @type {String}
     */
    var MESSAGE_RUNTIME_ERROR_DETECTED = "Program code contains syntax or runtime errors. Validation process has been compromised. Correct the errors and try again.";

    /**
     *  ...
     * 
     *  @type {Array}
     */
    var REFRESH_RATE = 2000;

    //----------------------------------------------------------------------
    // Public methods
    //----------------------------------------------------------------------

    /**
     *	...
     *
     *	@return {undefined}
     */
    m_this.add = function(scope, aliases, packages, exceptions) {
    	var c = new com.vectorpanic.jsoop.system.Config(scope, aliases, packages, exceptions);
        m_configs.push(c);
        update();
    };

    //----------------------------------------------------------------------
    // Private methods
    //----------------------------------------------------------------------

    /**
     *  ...
     *
     *  @return {undefined}
     */
    function preInit(event) {
        m_validationCompromised = true;
    }

    /**
     *	Initialises are parts
     *
     *	@return {undefined}
     */
    function init() {
    	initConsole();
    	initValidator();
    	initScriptExceptions();
    	initTimer();
    	update();
    }

    /** 
     *  Initialises the output console
     *
     *  @return {undefined}
     */
    function initConsole() {
        m_console = new com.vectorpanic.jsoop.console.Console();
        m_console.appendTo(document.body);
    }

    /** 
     *  Initialises the validator
     *
     *  @return {undefined}
     */
    function initValidator() {
        m_validator = new com.vectorpanic.jsoop.system.Validator(m_configs, m_console);
    }

    /** 
     *  Adds list of exceptions that the validator should skip
     *
     *  @return {undefined}
     */
    function initScriptExceptions() {
	    m_this.add(                          // Adds a default configuration 
			window.com.vectorpanic.jsoop,    // with a scope,
			["VPJsOOP", "com"],              // a list of aliases,
			["console", "scope", "system"],  // a list of packages (the packages are sub-packages under the general scope as defined above),
			["Manifest"]                     // and a list of exceptions
		);
    }

    /** 
     *  Initialises the timer that trigger the validation check at regular intervals
     *
     *  @return {undefined}
     */
    function initTimer() {
        window.setInterval(update, REFRESH_RATE);
    }

    /** 
     *  Performs an update by triggering a refresh to be performed by the validator 
     *
     *  @return {undefined}
     */
    function update() {
        if (m_validator != undefined) {
        	m_validator.refresh();
        }

        if (m_validationCompromised === true && m_console != undefined) {
            m_console.log(MESSAGE_RUNTIME_ERROR_DETECTED, 3);
        }
    }

    //----------------------------------------------------------------------
    // Bootstrap
    //----------------------------------------------------------------------

    /**
     *	Starts the tool when the page has loaded
     */
    if (window.addEventListener != undefined) window.addEventListener("load", init, "false");
    else if (window.attachEvent != undefined) window.attachEvent("onload", init);
    else window.onload = init;

    /**
     *  Checks for execution errors
     */
    if (window.addEventListener != undefined) window.addEventListener("error", preInit, "false");
    else if (window.attachEvent != undefined) window.attachEvent("onerror", preInit);
    else window.onerror = preInit;
    
    /**
     *	Return object through which the only public method add can be called
     */
    return m_this;

})();