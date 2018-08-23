/** global: chrome */
/** global: browser */

let pinnedCategory = null;

const func = (tabs) => {
  (chrome || browser).runtime.sendMessage({
    id: 'get_apps',
    tab: tabs[0],
    source: 'popup.js',
  }, (response) => {
    pinnedCategory = response.pinnedCategory;
    console.log(response.apps);
    replaceDomWhenReady(appsToDomTemplate(response));
  });
};

browser.tabs.query({ active: true, currentWindow: true })
  .then(func)
  .catch(console.error);

function replaceDomWhenReady(dom) {
  if (/complete|interactive|loaded/.test(document.readyState)) {
    replaceDom(dom);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      replaceDom(dom);
    });
  }
}

function replaceDom(domTemplate) {
  const container = document.getElementsByClassName('container')[0];

  container.appendChild(jsonToDOM(domTemplate, document, {}));

  const nodes = document.querySelectorAll('[data-i18n]');

  Array.prototype.forEach.call(nodes, (node) => {
    node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
  });
}

function appsToDomTemplate(response) {
  let template = [];
  let amp_supported_template = [];
  let amp_not_supported_template = [];
  //Control what categories of apps we will use
  let approved_categories = [1,6,10,11,12,18,36,41,42,59];

  if (response.tabCache && Object.keys(response.tabCache.detected).length > 0) {
    const categories = {};

    // Group apps by category
    for (const appName in response.tabCache.detected) {
      response.apps[appName].cats.forEach((cat) => {
        if (approved_categories.includes(cat)){
          categories[cat] = categories[cat] || { apps: [] };
          categories[cat].apps[appName] = appName;
        }
      });
    }
    for (const cat in categories) {
      const amp_supported_apps = [];
      const amp_not_supported_apps = [];

      for (const appName in categories[cat].apps) {
        const confidence = response.tabCache.detected[appName].confidenceTotal;
        const version = response.tabCache.detected[appName].version;
        if(isAMPSupported(appName)){
          amp_supported_apps.push(
            [
              'a', {
                class: 'detected__app',
                target: '_blank',
                href: `${response.apps[appName].website}`,
              }, [
                'img', {
                  class: 'detected__app-icon',
                  src: `../images/icons/${response.apps[appName].icon || 'default.svg'}`,
                },
              ], [
                'span', {
                  class: 'detected__app-name',
                },
                appName,
              ], version ? [
                'span', {
                  class: 'detected__app-version',
                },
                version,
              ] : null, confidence < 100 ? [
                'span', {
                  class: 'detected__app-confidence',
                },
                `${confidence}% sure`,
              ] : null,
            ],
          );
        } else {
          amp_not_supported_apps.push(
            [
              'a', {
                class: 'detected__app',
                target: '_blank',
                href: `${response.apps[appName].website}`,
              }, [
                'img', {
                  class: 'detected__app-icon',
                  src: `../images/icons/${response.apps[appName].icon || 'default.svg'}`,
                },
              ], [
                'span', {
                  class: 'detected__app-name',
                },
                appName,
              ], version ? [
                'span', {
                  class: 'detected__app-version',
                },
                version,
              ] : null, confidence < 100 ? [
                'span', {
                  class: 'detected__app-confidence',
                },
                `${confidence}% sure`,
              ] : null,
            ],
          );
        }
      }
      if(amp_supported_apps.length != 0){
        amp_supported_template.push(
            [
              'div', {
                class: 'detected__category',
              }, [
                'div', {
                  class: 'detected__category-name',
                }, [
                  'a', {
                    class: 'detected__category-link',
                    target: '_blank',
                    href: `https://www.wappalyzer.com/categories/${slugify(response.categories[cat].name)}`,
                  },
                  browser.i18n.getMessage(`categoryName${cat}`),
                ], [
                  'span', {
                    class: `detected__category-pin-wrapper${pinnedCategory == cat ? ' detected__category-pin-wrapper--active' : ''}`,
                    'data-category-id': cat,
                    title: browser.i18n.getMessage('categoryPin'),
                  }
                ],
              ], [
                'div', {
                  class: 'detected__apps',
                },
                amp_supported_apps,
              ],
            ],
          );
      }
      if(amp_not_supported_apps.length != 0){
        amp_not_supported_template.push(
            [
              'div', {
                class: 'detected__category',
              }, [
                'div', {
                  class: 'detected__category-name',
                }, [
                  'a', {
                    class: 'detected__category-link',
                    target: '_blank',
                    href: `https://www.wappalyzer.com/categories/${slugify(response.categories[cat].name)}`,
                  },
                  browser.i18n.getMessage(`categoryName${cat}`),
                ], [
                  'span', {
                    class: `detected__category-pin-wrapper${pinnedCategory == cat ? ' detected__category-pin-wrapper--active' : ''}`,
                    'data-category-id': cat,
                    title: browser.i18n.getMessage('categoryPin'),
                  },
                ],
              ], [
                'div', {
                  class: 'detected__apps',
                },
                amp_not_supported_apps,
              ],
            ],
          );
      }
    }
    
    

    template = [
          [
            'div', {
              class: 'amp_supported card',
            },
            amp_supported_template,
          ],
          [
            'div', {
              class: 'amp_not_supported card',
            },
            amp_not_supported_template,
          ]
        ];
  } else {
    template = [
      'div', {
        class: 'empty',
      },
      [
        'span', {
          class: 'empty__text',
        },
        browser.i18n.getMessage('noAppsDetected'),
      ],
    ];
  }

  return template;
}

function slugify(string) {
  return string.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/(?:^-|-$)/, '');
}


/**
 * TODO (alwalton@): get list of supported ads/analytics programatically
 * Check if vendor is in supported list of vendor names
 * @param {string} vendorName - name of vendor
 * @return {boolean}
 */
function isAMPSupported(appName) {
  console.log("testing " + appName);
  let ampSupported = [
    'A8',
    'A9',
    'AcccessTrade',
    'Adblade',
    'Adform',
    'Adfox',
    'Ad Generation',
    'Adhese',
    'ADITION',
    'Adman',
    'AdmanMedia',
    'AdReactor',
    'AdSense',
    'AdsNative',
    'AdSpirit',
    'AdSpeed',
    'AdStir',
    'AdTech',
    'AdThrive',
    'Ad Up Technology',
    'Adverline',
    'Adverticum',
    'AdvertServe',
    'Affiliate-B',
    'AMoAd',
    'AppNexus',
    'Atomx',
    'Bidtellect',
    'brainy',
    'CA A.J.A. Infeed',
    'CA-ProFit-X',
    'Chargeads',
    'Colombia',
    'Content.ad',
    'Criteo',
    'CSA',
    'CxenseDisplay',
    'Dianomi',
    'DistroScale',
    'Dot and Media',
    'Doubleclick',
    'DoubleClick for Publishers (DFP)',
    'DoubleClick Ad Exchange (AdX)',
    'E-Planning',
    'Ezoic',
    'FlexOneELEPHANT',
    'FlexOneHARRIER',
    'fluct',
    'Felmat',
    'Flite',
    'Fusion',
    'Google AdSense',
    'GenieeSSP',
    'GMOSSP',
    'GumGum',
    'Holder',
    'Imedia',
    'I-Mobile',
    'iBillboard',
    'Improve Digital',
    'Index Exchange',
    'Industrybrains',
    'InMobi',
    'Kargo',
    'Kiosked',
    'Kixer',
    'Ligatus',
    'LOKA',
    'MADS',
    'MANTIS',
    'MediaImpact',
    'Media.net',
    'Mediavine',
    'Meg',
    'MicroAd',
    'Mixpo',
    'myWidget',
    'Nativo',
    'Navegg',
    'Nend',
    'NETLETIX',
    'Nokta',
    'Open AdStream (OAS)',
    'OpenX',
    'plista',
    'polymorphicAds',
    'popin',
    'PubMatic',
    'Pubmine',
    'PulsePoint',
    'Purch',
    'Rambler&Co',
    'Relap',
    'Revcontent',
    'Rubicon Project',
    'Sharethrough',
    'Sklik',
    'SlimCut Media',
    'Smart AdServer',
    'smartclip',
    'Sortable',
    'SOVRN',
    'SpotX',
    'SunMedia',
    'Swoop',
    'Teads',
    'TripleLift',
    'ValueCommerce',
    'Webediads',
    'Weborama',
    'Widespace',
    'Xlift',
    'Yahoo',
    'YahooJP',
    'Yandex',
    'Yieldbot',
    'Yieldmo',
    'Yieldone',
    'Zedo',
    'Zucks',
    'Bringhub',
    'Outbrain',
    'Taboola',
    'ZergNet',
    'Acquia Lift',
    'Adobe Analytics',
    'AFS Analytics',
    'AT Internet',
    'Burt',
    'Baidu Analytics',
    'Chartbeat',
    'Clicky Web Analytics',
    'comScore',
    'Cxense',
    'Dynatrace',
    'Eulerian Analytics',
    'Gemius',
    'Google AdWords',
    'Google Analytics',
    'INFOnline / IVW',
    'Krux',
    'Linkpulse',
    'Lotame',
    'Médiamétrie',
    'mParticle',
    'Nielsen',
    'OEWA',
    'Parsely',
    'Piano',
    'Quantcast',
    'Segment',
    'SOASTA mPulse',
    'SimpleReach',
    'Snowplow Analytics',
    'Webtrekk',
    'Yandex Metrica',
    'Google Tag Manager',
    'Accelerated Mobile Pages',
  ];
  // If it is NOT in list of supported vendors
  return ampSupported.includes(appName);
}