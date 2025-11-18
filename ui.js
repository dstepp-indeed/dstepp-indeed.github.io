(() => {
    const LOCAL_STORAGE = {
        SDK_BACKEND_OVERRIDE: 'indeedSdkBackendOverride',
        SDK_CLIENT_KEY: 'indeedSdkClientKey',
        SDK_JS_URL: 'indeedSdkJsUrl',
        SDK_MODULE: 'indeedSdkModule',
        SDK_SCOPE: 'indeedSdkScope',
        SDK_SCOPE_BRANCH: 'indeedSdkScopeBranch',
    };
    const PARAMS = {
        AUTH_TYPE: 'auth',
        AUTO: 'auto',
        MODULE: 'module',
        PROPS: 'props',
        SCOPE: 'scope',
        SCOPE_BRANCH: 'scopebranch',
        SDK_JS_URL: 'sdkurl',
        SDK_BACKEND_OVERRIDE: 'indeedsdkbackendoverride',
        TYPE: 'type'
    }

    const params = new URLSearchParams(location.search);
    const autoload = params.get(PARAMS.AUTO) === 'true' || params.get('auto') === '1' || params.get('auto') === '';

    const DEFAULT_SDK_URL = 'https://sdk.indeed.com/js/preview/sdk.js';
    const DEFAULT_SDK_URL_STABLE = 'https://sdk.indeed.com/js/stable/sdk.js';
    const DEFAULT_SDK_URL_V03 = 'https://sdk.indeed.com/js/v0.3/sdk.js';
    const DEFAULT_SDK_BACKEND_URL = undefined;
    if (DEFAULT_SDK_BACKEND_URL) {
        window.localStorage.setItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE, DEFAULT_SDK_BACKEND_URL);
    }
    const DEFAULT_SDK_SCOPE = 'dstepp-backstage-test';
    const DEFAULT_SDK_LIBRARY_SCOPE = 'dstepp-sdk-library-backstage-2';
    const DEFAULT_SDK_MODULE = 'HelloSdk'; // TODO
    const DEFAULT_SDK_MODULE_PROPS = undefined; // TODO
    const BACKEND_URL_HOBO_QA = 'https://one-platform-sdk.sandbox.qa.indeed.net/api';
    const BACKEND_URL_HOBO_LOCAL = 'https://one-host.hobo-local.qa.indeed.net/api';
    const BACKEND_URL_BRANCH = 'https://jira-USERNAME-onehost-XXXX-one-host-sdk.sandbox.qa.indeed.net/api';

    const alertStatus = (message, type) => {
        document.getElementById('alertstatus').innerHTML = message;
        document.getElementById('alertstatus').className = `alertstatus${type ?? ''}`;
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
        const loadv3Button = document.getElementById('loadsdkv03');
        
        const initButton = document.getElementById('initsdk');
        const initBackendUrlBox = document.getElementById('initsdkbackendurl');
        const initBackendUrlDefaultButton = document.getElementById('initsdkbackendurldefault');
        const initBackendUrlQaButton = document.getElementById('initsdkbackendurlqa');
        const initBackendUrlHoboButton = document.getElementById('initsdkbackendurlhobo');
        const initBackendUrlBranchButton = document.getElementById('initsdkbackendurlbranch');
        
        const authCookieRadio = document.getElementById('auth_cookie');
        const authOauthRadio = document.getElementById('auth_oauth');
        const authOauthAccessTokenBox = document.getElementById('oauthaccesstoken');

        const loadScopeButton = document.getElementById('loadsdkscope');
        const elementsRadio = document.getElementById('scopeorlibrary_scope');
        const libraryRadio = document.getElementById('scopeorlibrary_library');
        const loadSdkScopeBox = document.getElementById('loadsdkscopename');
        const scopeOrLibraryBranchPrimaryRadio = document.getElementById('scopeorlibrarybranch_primary');
        const scopeOrLibraryBranchBranchRadio = document.getElementById('scopeorlibrarybranch_branch');
        const scopeOrLibraryBranchBranchNameBox = document.getElementById('scopeorlibrarybranch_branch_name');
        
        const moduleNameSelect = document.getElementById('createsdkmodulename');
        const createModuleButton = document.getElementById('createsdkmodule');

        const moduleContainer = document.getElementById('modulecontainer');

        loadSdkUrlBox.value = params.get(PARAMS.SDK_JS_URL) || window.localStorage.getItem(LOCAL_STORAGE.SDK_JS_URL) || DEFAULT_SDK_URL;
        authCookieRadio.checked = params.get(PARAMS.AUTH_TYPE) !== 'oauth';
        authOauthRadio.checked = params.get(PARAMS.AUTH_TYPE) === 'oauth';
        libraryRadio.checked = params.get(PARAMS.TYPE) === 'library';
        loadSdkScopeBox.value = params.get(PARAMS.SCOPE) || window.localStorage.getItem(LOCAL_STORAGE.SDK_SCOPE) || (libraryRadio.checked ? DEFAULT_SDK_LIBRARY_SCOPE : DEFAULT_SDK_SCOPE);
        scopeOrLibraryBranchBranchRadio.checked = params.get(PARAMS.SCOPE_BRANCH) && params.get(PARAMS.SCOPE_BRANCH) !== 'primary';
        scopeOrLibraryBranchPrimaryRadio.checked = !scopeOrLibraryBranchBranchRadio.checked;
        scopeOrLibraryBranchBranchNameBox.value = params.get(PARAMS.SCOPE_BRANCH) || window.localStorage.getItem(LOCAL_STORAGE.SDK_SCOPE_BRANCH) || '';
        scopeOrLibraryBranchBranchNameBox.onkeyup = (e) => {
            if (scopeOrLibraryBranchBranchNameBox.value) {
                scopeOrLibraryBranchBranchRadio.checked = true;
            }
        };
        elementsRadio.checked = !libraryRadio.checked;
        initBackendUrlBox.value = params.get(PARAMS.SDK_BACKEND_OVERRIDE) || window.localStorage.getItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE) || '';

        // sdk control functions
        const loadSdk = (sdkJsUrl, callback) => {
            if (!sdkJsUrl) {
                sdkJsUrl = loadSdkUrlBox.value;
            }
            if (window.Indeed || document.getElementById('sdkinitscript')) {
                alertStatus('SDK already initialized!', 'warn');
                return;
            }
            const scr = document.createElement('script');
            scr.id = 'sdkinitscript';
            scr.src = sdkJsUrl;
            scr.onload = () => {
                window.localStorage.setItem(LOCAL_STORAGE.SDK_JS_URL, sdkJsUrl);
                alertStatus('SDK loaded.', 'success');
                doEnabling();
                if (callback) {
                    callback();
                }
            };
            scr.onerror = (e) => {
                alertStatus('Error: SDK unable to load.', 'error');
                console.error(e);
                document.getElementById('sdkinitscript').remove();
            };
            alertStatus('SDK loading ...', 'info');
            document.head.appendChild(scr);
        };

        const initSdk = async (options) => {
            // TODO: auth options
            if (!window.Indeed || !window.Indeed.init) {
                alertStatus('Error: SDK is not initialized!');
                return;
            }
            if (initialized) {
                alertStatus('Error: SDK has already been initialized.', 'error');
                return;
            }

            alertStatus('Initializing SDK ...', 'info');

            if (initBackendUrlBox.value) {
                window.localStorage.setItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE, initBackendUrlBox.value);
            } else {
                window.localStorage.removeItem(LOCAL_STORAGE.SDK_BACKEND_OVERRIDE);
            }

            if (authOauthRadio.checked && authOauthAccessTokenBox.value) {
                options = {
                    ...options,
                    clientKey: window.localStorage.getItem(LOCAL_STORAGE.SDK_CLIENT_KEY) || 'dstepp-indeed.github.io',
                    auth: {
                        accessToken: authOauthAccessTokenBox.value
                    }
                };
            }

            try {
                await window.Indeed.init(options);
                initialized = true;
                alertStatus('SDK initialized.', 'success');
                doEnabling();
            } catch (e) {
                alertStatus('Error: SDK unable to init: ' + String(e.message || e), 'error');
                console.error(e);
            }
        };

        const loadScopeOrLibrary = async (scopeName, loadType) => {
            if (!initialized) {
                alertStatus('Error: SDK is not initialized!', 'warn');
                return;
            }
            if (!scopeName) {
                scopeName = loadSdkScopeBox.value;
            }

            let branch = '';
            if (scopeName.includes(':')) {
                // allow loading of a branch by passing 'scope:branch' format
                const tokens = scopeName.split(/:/g);
                scopeName = tokens[0];
                branch = tokens[1];
            } else {
                // check primary/branch radios to let user input branch
                if (scopeOrLibraryBranchBranchRadio.checked) {
                    branch = scopeOrLibraryBranchBranchNameBox.value.trim();
                }
            }

            // convert branch string to path name, e.g. 'jira/ksmith12/ONEHOST-456' => 'jira-ksmith12-onehost-456'
            if (branch) {
                branch = branch.toLowerCase?.().replaceAll('/', '-');
            }

            // check whether loading a scope of elements or a procedural JS library
            if (!loadType) {
                loadType = libraryRadio.checked ? 'library' : 'scope';
            }

            alertStatus(`Loading ${loadType} ${scopeName} ...`, 'info');

            try {
                const options = branch && branch !== 'primary' ? { branch, stagingLevel: 'qa' } : undefined;
                if (loadType === 'library') {
                    const lib = await window.Indeed.library.load(scopeName, options);
                    if (!lib) {
                        alertStatus(`Library ${scopeName} load fail or empty.`, 'error');
                        return;
                    }

                    if (typeof window.sdkLibraries === 'undefined') {
                        window.sdkLibraries = {};
                    }
                    window.sdkLibraries[scopeName] = lib;

                    // dump the lib's members into the global window object to make them easier to use
                    const POLLUTE_GLOBAL_OBJECT = true;
                    if (POLLUTE_GLOBAL_OBJECT) {
                        Object.assign(window, lib);
                        alertStatus(`Library ${scopeName} loaded globally. [${Object.keys(lib)}]`, 'success');
                    } else {
                        alertStatus(`Library ${scopeName} loaded into window.sdkLibraries['${scopeName}']. [${Object.keys(lib)}]`, 'success');
                    }
                } else {
                    const scope = await window.Indeed.elements.load(scopeName);
                    if (!scope) {
                        alertStatus('Scope ' + scopeName + ' load fail or empty.', 'error');
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
                    alertStatus(`Scope ${scopeName} loaded.`, 'success');
                }

                doEnabling();
            } catch (e) {
                alertStatus(String(e.message || e), 'error');
                console.error(e);
            }
        };

        const createAndMountModule = async (scopeName, moduleName, createOptions, mountOptions) => {
            if (!initialized) {
                alertStatus('Error: SDK is not initialized!', 'warn');
                return;
            }

            if (libraryRadio.checked) {
                return; // wrong mode
            }

            if (!scopeName) {
                scopeName = loadSdkScopeBox.value;
            }
            if (!scopeName || !window.sdkScopes || !window.sdkScopes[scopeName]) {
                alertStatus('Error: Scope not found or not loaded', 'error');
                return;
            }

            if (!moduleName) {
                moduleName = moduleNameSelect.value;
            }
            if (!moduleName) {
                alertStatus('Error: No module name selected', 'warn');
                return;
            }

            const moduleFactory = window.sdkScopes[scopeName][moduleName];
            if (!moduleFactory) {
                alertStatus('Error: module ' + moduleName + ' not found or cannot be created.', 'error');
                return;
            }

            // TODO: module props
            alertStatus('Creating and mounting module ' + moduleName + ' ...', 'info');
            moduleContainer.innerHTML = '';
            try {
                const module = moduleFactory.create(moduleName, createOptions);

                module.mount(moduleContainer, mountOptions);

                alertStatus('Module ' + moduleName + ' mounted.', 'success');
                doEnabling();
            } catch (e) {
                alertStatus('Error: SDK unable to create/mount: ' + String(e.message || e), 'error');
                console.error(e);
            }
        }

        const buildShareUrl = () => {
            const url = new URL(location);
            const params = url.searchParams;
            if (loadSdkUrlBox.value && loadSdkUrlBox.value !== DEFAULT_SDK_URL) {
                params.set(PARAMS.SDK_JS_URL, loadSdkUrlBox.value);
            }
            if (initBackendUrlBox.value) {
                params.set(PARAMS.SDK_BACKEND_OVERRIDE, initBackendUrlBox.value);
            }
            if (loadSdkScopeBox.value) {
                params.set(PARAMS.SCOPE, loadSdkScopeBox.value);
            }
            if (libraryRadio.checked) {
                params.set(PARAMS.TYPE, 'library');
            }
            if (moduleNameSelect.value) {
                params.set(PARAMS.MODULE, moduleNameSelect.value);
            }
            if (authOauthRadio.checked) {
                params.set(PARAMS.AUTH_TYPE, 'oauth');
            }
            return url.toString();
        };

        const doEnabling = () => {
            const loaded = !!window.Indeed;
            loadButton.disabled = loaded;
            loadSdkUrlBox.disabled = loaded;

            const initDisabled = !window.Indeed || !window.Indeed.init || initialized;
            initButton.disabled = initDisabled;
            initBackendUrlBox.disabled = initDisabled;
            initBackendUrlDefaultButton.disabled = initDisabled;
            initBackendUrlQaButton.disabled = initDisabled;
            initBackendUrlHoboButton.disabled = initDisabled;
            initBackendUrlBranchButton.disabled = initDisabled;
            authCookieRadio.disabled = initDisabled;
            authOauthRadio.disabled = initDisabled;
            authOauthAccessTokenBox.disabled = initDisabled;

            loadScopeButton.disabled = !initialized;
            elementsRadio.disabled = !initialized;
            libraryRadio.disabled = !initialized;
            loadSdkScopeBox.disabled = !initialized;
            scopeOrLibraryBranchBranchRadio.disabled = !initialized;
            scopeOrLibraryBranchPrimaryRadio.disabled = !initialized;
            scopeOrLibraryBranchBranchNameBox.disabled = !initialized;
            moduleNameSelect.disabled = typeof window.sdkScopes === 'undefined';
            createModuleButton.disabled = typeof window.sdkScopes === 'undefined' || !moduleNameSelect.value;
            document.getElementById('stagecreatemountmodule').style.display = libraryRadio.checked ? 'none' : null;

            const shareUrl = buildShareUrl();
            document.getElementById('shareurl').innerHTML = 'Share URL: <a target="_blank" href="' + shareUrl + '">' + shareUrl + "</a>";
        }

        // event handlers
        loadButton.addEventListener('click', () => {
            loadSdk(loadSdkUrlBox.value);
        });
        loadDefaultButton.addEventListener('click', () => {
            loadSdkUrlBox.value = DEFAULT_SDK_URL;
            window.localStorage.removeItem(LOCAL_STORAGE.SDK_JS_URL);
        });
        loadStableButton.addEventListener('click', () => {
            loadSdkUrlBox.value = DEFAULT_SDK_URL_STABLE;
            window.localStorage.removeItem(LOCAL_STORAGE.SDK_JS_URL);
        });
        loadv3Button.addEventListener('click', () => {
            loadSdkUrlBox.value = DEFAULT_SDK_URL_V03;
            window.localStorage.removeItem(LOCAL_STORAGE.SDK_JS_URL);
        });
        initButton.addEventListener('click', async () => {
            await initSdk(); // TODO: options
        });
        initBackendUrlDefaultButton.addEventListener('click', () => {
            initBackendUrlBox.value = '';
        });
        initBackendUrlQaButton.addEventListener('click', () => {
            initBackendUrlBox.value = BACKEND_URL_HOBO_QA;
        });
        initBackendUrlHoboButton.addEventListener('click', () => {
            initBackendUrlBox.value = BACKEND_URL_HOBO_LOCAL;
        });
        initBackendUrlBranchButton.addEventListener('click', () => {
            initBackendUrlBox.value = BACKEND_URL_BRANCH;
        });
        loadScopeButton.addEventListener('click', async () => {
            await loadScopeOrLibrary(loadSdkScopeBox.value);
        });
        moduleNameSelect.addEventListener('change', doEnabling);
        elementsRadio.addEventListener('change', doEnabling);
        libraryRadio.addEventListener('change', doEnabling);
        createModuleButton.addEventListener('click', async () => {
            await createAndMountModule(loadSdkScopeBox.value, moduleNameSelect.value); // TODO: options
        });

        if (autoload) {
            console.log('Autoloading the SDK ...');
            loadSdk(null, async () => {
                await initSdk();
                await loadScopeOrLibrary();
                await createAndMountModule();
            });
        }
    });
})();
