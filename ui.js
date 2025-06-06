(() => {
    const LOCAL_STORAGE = {
        SDK_BACKEND_OVERRIDE: 'indeedSdkBackendOverride',
        SDK_JS_URL: 'indeedSdkJsUrl',
        SDK_MODULE: 'indeedSdkModule',
        SDK_SCOPE: 'indeedSdkScope'
    };
    const PARAMS = {
        SDK_JS_URL: 'sdkurl',
        SDK_BACKEND_OVERRIDE: 'indeedsdkbackendoverride',
        SCOPE: 'scope',
        MODULE: 'module',
        PROPS: 'props',
        AUTO: 'auto'
    }

    const params = new URLSearchParams(location.search);
    const autoload = params.get(PARAMS.AUTO) === 'true' || params.get('auto') === '1' || params.get('auto') === '';
    const DEFAULT_SDK_URL = params.get(PARAMS.SDK_JS_URL) || 'https://sdk.indeed.com/js/preview/sdk.js';
    const DEFAULT_SDK_URL_STABLE = params.get(PARAMS.SDK_JS_URL) || 'https://sdk.indeed.com/js/stable/sdk.js';
    const DEFAULT_SDK_BACKEND_URL = params.get(PARAMS.SDK_BACKEND_OVERRIDE) ?? undefined;
    if (DEFAULT_SDK_BACKEND_URL) {
        window.localStorage.setItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE, DEFAULT_SDK_BACKEND_URL);
    }
    const DEFAULT_SDK_SCOPE = params.get(PARAMS.SCOPE) || 'dstepp-backstage-test';
    const DEFAULT_SDK_MODULE = params.get(PARAMS.MODULE) || 'HelloSdk'; // TODO
    const DEFAULT_SDK_MODULE_PROPS = params.get(PARAMS.PROPS) ?? undefined; // TODO
    const BACKEND_URL_HOBO_LOCAL = 'https://one-host.hobo-local.qa.indeed.net/api';
    const BACKEND_URL_BRANCH = 'https://jira-USERNAME-onehost-XXXX-one-host-sdk.sandbox.qa.indeed.net/api';

    const alertStatus = (message) => {
        document.getElementById('alertstatus').innerHTML = message;
    };

    const createOption = (value, text, selected) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text || value;
        option.selected = !!selected;
        return option;
    };

    window.addEventListener('load', () => {
        let initialized = false;
        
        const loadButton = document.getElementById('loadsdk');
        const loadSdkUrlBox = document.getElementById('loadsdkurl');
        const loadDefaultButton = document.getElementById('loadsdkpreview');
        const loadStableButton = document.getElementById('loadsdkstable');
        
        const initButton = document.getElementById('initsdk');
        const initBackendUrlBox = document.getElementById('initsdkbackendurl');
        const initBackendUrlDefaultButton = document.getElementById('initsdkbackendurldefault');
        const initBackendUrlHoboButton = document.getElementById('initsdkbackendurlhobo');
        const initBackendUrlBranchButton = document.getElementById('initsdkbackendurlbranch');
        
        const loadScopeButton = document.getElementById('loadsdkscope');
        const loadSdkScopeBox = document.getElementById('loadsdkscopename');
        
        const moduleNameSelect = document.getElementById('createsdkmodulename');
        const createModuleButton = document.getElementById('createsdkmodule');

        const moduleContainer = document.getElementById('modulecontainer');

        loadSdkUrlBox.value = params.get(PARAMS.SDK_JS_URL) || window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) || DEFAULT_SDK_URL;
        loadSdkScopeBox.value = params.get(PARAMS.SCOPE) || window.localStorage.getItem(LOCAL_STORAGE.SDK_SCOPE) || DEFAULT_SDK_SCOPE;
        initBackendUrlBox.value = DEFAULT_SDK_BACKEND_URL || window.localStorage.getItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE) || '';

        // sdk control functions
        const loadSdk = (sdkJsUrl, callback) => {
            if (!sdkJsUrl) {
                sdkJsUrl = loadSdkUrlBox.value;
            }
            if (window.Indeed || document.getElementById('sdkinitscript')) {
                alertStatus('SDK already initialized!');
                return;
            }
            const scr = document.createElement('script');
            scr.id = 'sdkinitscript';
            scr.src = sdkJsUrl;
            scr.onload = () => {
                window.localStorage.setItem(LOCAL_STORAGE.SDK_JS_URL, sdkJsUrl);
                alertStatus('SDK loaded.');
                doEnabling();
                if (callback) {
                    callback();
                }
            };
            scr.onerror = (e) => {
                alertStatus('Error: SDK unable to load.');
                console.error(e);
                document.getElementById('sdkinitscript').remove();
            };
            alertStatus('SDK loading ...');
            document.head.appendChild(scr);
        };

        const initSdk = async (options) => {
            // TODO: auth options
            if (!window.Indeed || !window.Indeed.init) {
                alertStatus('Error: SDK is not initialized!');
                return;
            }
            if (initialized) {
                alertStatus('Error: SDK has already been initialized.');
                return;
            }

            alertStatus('Initializing SDK ...');
            try {
                await window.Indeed.init(options);
                initialized = true;
                alertStatus('SDK initialized.');
                doEnabling();
            } catch (e) {
                alertStatus('Error: SDK unable to init: ' + String(e.message || e));
                console.error(e);
            }
        };

        const loadScope = async (scopeName) => {
            if (!initialized) {
                alertStatus('Error: SDK is not initialized!');
                return;
            }
            if (!scopeName) {
                scopeName = loadSdkScopeBox.value;
            }
            alertStatus('Loading scope ' + scopeName + ' ...');
            try {
                const scope = await window.Indeed.elements.load(scopeName);
                if (!scope) {
                    alertStatus('Scope ' + scopeName + ' load fail or empty.');
                    return;
                }

                if (typeof window.sdkScopes === 'undefined') {
                    window.sdkScopes = {};
                }
                window.sdkScopes[scopeName] = scope;
                const modules = Object.keys(scope);
                moduleNameSelect.innerHTML = '';
                moduleNameSelect.appendChild(createOption('', '(choose a module)'));
                for (let i = 0; i < modules.length; i++) {
                    moduleNameSelect.appendChild(createOption(
                        modules[i],
                        modules[i],
                        modules[i] === DEFAULT_SDK_MODULE // selected
                    ));
                }
                window.localStorage.setItem(LOCAL_STORAGE.SDK_SCOPE, scopeName);
                alertStatus('Scope ' + scopeName + ' loaded.');
                doEnabling();
            } catch (e) {
                alertStatus(String(e.message || e));
                console.error(e);
            }
        };

        const createAndMountModule = async (scopeName, moduleName, createOptions, mountOptions) => {
            if (!initialized) {
                alertStatus('Error: SDK is not initialized!');
                return;
            }

            if (!scopeName) {
                scopeName = loadSdkScopeBox.value;
            }
            if (!scopeName || !window.sdkScopes || !window.sdkScopes[scopeName]) {
                alertStatus('Error: Scope not found or not loaded');
                return;
            }

            if (!moduleName) {
                moduleName = moduleNameSelect.value;
            }
            if (!moduleName) {
                alertStatus('Error: No module name selected');
                return;
            }

            const moduleFactory = window.sdkScopes[scopeName][moduleName];
            if (!moduleFactory) {
                alertStatus('Error: module ' + moduleName + ' not found or cannot be created.');
                return;
            }

            // TODO: module props
            alertStatus('Creating and mounting module ' + moduleName + ' ...');
            moduleContainer.innerHTML = '';
            try {
                const module = moduleFactory.create(moduleName, createOptions);

                module.mount(moduleContainer, mountOptions);

                alertStatus('Module ' + moduleName + ' mounted.');
                doEnabling();
            } catch (e) {
                alertStatus('Error: SDK unable to create/mount: ' + String(e.message || e));
                console.error(e);
            }
        }

        const doEnabling = () => {
            loadButton.disabled = window.Indeed;
            loadSdkUrlBox.disabled = window.Indeed;
            initButton.disabled = !window.Indeed || !window.Indeed.init || initialized;
            initBackendUrlBox.disabled = !window.Indeed || !window.Indeed.init || initialized;
            initBackendUrlDefaultButton.disabled = !window.Indeed || !window.Indeed.init || initialized;
            initBackendUrlHoboButton.disabled = !window.Indeed || !window.Indeed.init || initialized;
            initBackendUrlBranchButton.disabled = !window.Indeed || !window.Indeed.init || initialized;
            loadScopeButton.disabled = !initialized;
            loadSdkScopeBox.disabled = !initialized;
            moduleNameSelect.disabled = typeof window.sdkScopes === 'undefined';
            createModuleButton.disabled = typeof window.sdkScopes === 'undefined' || !moduleNameSelect.value;

            const params = new URLSearchParams();
            if (loadSdkUrlBox.value && loadSdkUrlBox.value !== DEFAULT_SDK_URL) {
                params.set(PARAMS.SDK_JS_URL, loadSdkUrlBox.value);
            }
            if (initBackendUrlBox.value) {
                params.set(PARAMS.SDK_BACKEND_OVERRIDE, initBackendUrlBox.value);
            }
            if (loadSdkScopeBox.value) {
                params.set(PARAMS.SCOPE, loadSdkScopeBox.value);
            }
            if (moduleNameSelect.value) {
                params.set(PARAMS.MODULE, moduleNameSelect.value);
            }
            let url = new URL(location);
            url.params = params;
            document.getElementById('shareurl').innerHTML = 'Share URL: <a target="_blank" href="' + url.toString() + '">' + url.toString() + "</a>";
        };

        // event handlers
        loadButton.addEventListener('click', () => {
            loadSdk(loadSdkUrlBox.value);
        });
        loadDefaultButton.addEventListener('click', () => {
            loadSdkUrlBox.value = window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) ?? DEFAULT_SDK_URL;
            window.localStorage.removeItem(LOCAL_STORAGE.SDK_JS_URL);
        });
        loadStableButton.addEventListener('click', () => {
            loadSdkUrlBox.value = window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) ?? DEFAULT_SDK_URL_STABLE;
        });
        initButton.addEventListener('click', async () => {
            await initSdk(); // TODO: options
        });
        initBackendUrlDefaultButton.addEventListener('click', () => {
            initBackendUrlBox.value = '';
        });
        initBackendUrlHoboButton.addEventListener('click', () => {
            initBackendUrlBox.value = BACKEND_URL_HOBO_LOCAL;
        });
        initBackendUrlBranchButton.addEventListener('click', () => {
            initBackendUrlBox.value = BACKEND_URL_BRANCH;
        });
        loadScopeButton.addEventListener('click', async () => {
            await loadScope(loadSdkScopeBox.value);
        });
        moduleNameSelect.addEventListener('change', doEnabling);
        createModuleButton.addEventListener('click', async () => {
            await createAndMountModule(loadSdkScopeBox.value, moduleNameSelect.value); // TODO: options
        });

        if (autoload) {
            console.log('Autoloading the SDK ...');
            loadSdk(null, async () => {
                await initSdk();
                await loadScope();
                await createAndMountModule();
            });
        }
    });
})();
