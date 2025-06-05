(() => {
    const LOCAL_STORAGE = {
        SDK_BACKEND_OVERRIDE: 'indeedSdkBackendOverride',
        SDK_JS_URL: 'indeedSdkJsUrl',
        SDK_MODULE: 'indeedSdkModule',
        SDK_SCOPE: 'indeedSdkScope'
    };

    const params = new URLSearchParams(location.search);
    const DEFAULT_SDK_URL = params.get('loadsdkurl') || 'https://sdk.indeed.com/js/preview/sdk.js';
    const DEFAULT_SDK_URL_STABLE = params.get('loadsdkurl') || 'https://sdk.indeed.com/js/stable/sdk.js';
    const DEFAULT_SDK_BACKEND_URL = params.get('sdkbackendurl') ?? undefined;
    const DEFAULT_SDK_SCOPE = params.get('scope') || 'dstepp-backstage-test';
    const DEFAULT_SDK_MODULE = params.get('module') || 'HelloSdk'; // TODO
    const DEFAULT_SDK_MODULE_PROPS = params.get('props') ?? undefined; // TODO
    const BACKEND_URL_HOBO_LOCAL = 'https://one-host.hobo-local.qa.indeed.net/api';
    const BACKEND_URL_BRANCH = 'https://jira-USERNAME-onehost-XXXX-one-host-sdk.sandbox.qa.indeed.net/api';

    const alertStatus = (message) => {
        document.getElementById('alertstatus').innerHTML = message;
    };

    const createOption = (value, text) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text || value;
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
        };

        loadSdkUrlBox.value = params.get('sdkurl') || window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) || DEFAULT_SDK_URL;
        loadSdkScopeBox.value = params.get('scope') || window.localStorage.getItem(LOCAL_STORAGE.SDK_SCOPE) || DEFAULT_SDK_SCOPE;
        initBackendUrlBox.value = params.get('') || window.localStorage.getItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE) || '';

        loadButton.addEventListener('click', () => {
            if (window.Indeed || document.getElementById('sdkinitscript')) {
                alertStatus('SDK already initialized!');
                return;
            }
            const scr = document.createElement('script');
            scr.id = 'sdkinitscript';
            scr.src = loadSdkUrlBox.value;
            scr.onload = () => {
                window.localStorage.setItem(LOCAL_STORAGE.SDK_JS_URL, loadSdkUrlBox.value);
                alertStatus('SDK loaded.');
                doEnabling();
            };
            scr.onerror = (e) => {
                alertStatus('Error: SDK unable to load.');
                console.error(e);
                document.getElementById('sdkinitscript').remove();
            }
            alertStatus('SDK loading ...');
            document.head.appendChild(scr);
        });

        loadDefaultButton.addEventListener('click', () => {
            loadSdkUrlBox.value = window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) ?? DEFAULT_SDK_URL;
            window.localStorage.removeItem(LOCAL_STORAGE.SDK_JS_URL);
        });

        loadStableButton.addEventListener('click', () => {
            loadSdkUrlBox.value = window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) ?? DEFAULT_SDK_URL_STABLE;
        });

        initButton.addEventListener('click', async () => {
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
                await window.Indeed.init();
                initialized = true;
                alertStatus('SDK initialized.');
                doEnabling();
            } catch (e) {
                alertStatus('Error: SDK unable to init: ' + String(e.message || e));
                console.error(e);
            }
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
            if (!initialized) {
                alertStatus('Error: SDK is not initialized!');
                return;
            }
            const scopeName = loadSdkScopeBox.value;
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
                    moduleNameSelect.appendChild(createOption(modules[i]));
                }
                window.localStorage.setItem(LOCAL_STORAGE.SDK_SCOPE, scopeName);
                alertStatus('Scope ' + scopeName + ' loaded.');
                doEnabling();
            } catch (e) {
                alertStatus(String(e.message || e));
                console.error(e);
            }
        });

        createModuleButton.addEventListener('click', async () => {
            if (!initialized) {
                alertStatus('Error: SDK is not initialized!');
                return;
            }
            const scopeName = loadSdkScopeBox.value;
            if (!scopeName || !window.sdkScopes || !window.sdkScopes[scopeName]) {
                alertStatus('Error: Scope not found or not loaded');
                return;
            }

            const moduleName = moduleNameSelect.value;
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
                const module = moduleFactory.create(moduleName);

                module.mount(moduleContainer);

                alertStatus('Module ' + moduleName + ' mounted.');
                doEnabling();
            } catch (e) {
                alertStatus('Error: SDK unable to create/mount: ' + String(e.message || e));
                console.error(e);
            }
        });
    });
})();
