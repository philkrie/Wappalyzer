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

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  container.appendChild(jsonToDOM(domTemplate, document, {}));

  const nodes = document.querySelectorAll('[data-i18n]');

  Array.prototype.forEach.call(nodes, (node) => {
    node.childNodes[0].nodeValue = browser.i18n.getMessage(node.dataset.i18n);
  });

  Array.from(document.querySelectorAll('.detected__category-pin-wrapper')).forEach((pin) => {
    pin.addEventListener('click', () => {
      const categoryId = parseInt(pin.dataset.categoryId, 10);

      if (categoryId === pinnedCategory) {
        pin.className = 'detected__category-pin-wrapper';

        pinnedCategory = null;
      } else {
        const active = document.querySelector('.detected__category-pin-wrapper--active');

        if (active) {
          active.className = 'detected__category-pin-wrapper';
        }

        pin.className = 'detected__category-pin-wrapper detected__category-pin-wrapper--active';

        pinnedCategory = categoryId;
      }

      (chrome || browser).runtime.sendMessage({
        id: 'set_option',
        key: 'pinnedCategory',
        value: pinnedCategory,
      });
    });
  });
}

function appsToDomTemplate(response) {
  let template = [];
  let amp_supported_template = [];
  let amp_not_supported_template = [];

  if (response.tabCache && Object.keys(response.tabCache.detected).length > 0) {
    const categories = {};

    // Group apps by category
    for (const appName in response.tabCache.detected) {
      response.apps[appName].cats.forEach((cat) => {
        categories[cat] = categories[cat] || { apps: [] };

        categories[cat].apps[appName] = appName;
      });
    }
    console.log("Categories:");
    console.log(categories);
    for (const cat in categories) {
      const amp_supported_apps = [];
      const amp_not_supported_apps = [];
      console.log("Categorsy:" + cat);

      for (const appName in categories[cat].apps) {
        const confidence = response.tabCache.detected[appName].confidenceTotal;
        const version = response.tabCache.detected[appName].version;
        console.log("Trying " + appName);
        if(isAMPSupported(appName)){
          console.log(appName + " is supported");
          amp_supported_apps.push(
            [
              'a', {
                class: 'detected__app',
                target: '_blank',
                href: `https://www.wappalyzer.com/technologies/${slugify(appName)}`,
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
                  }, [
                    'img', {
                      class: 'detected__category-pin detected__category-pin--active',
                      src: '../images/pin-active.svg',
                    },
                  ], [
                    'img', {
                      class: 'detected__category-pin detected__category-pin--inactive',
                      src: '../images/pin.svg',
                    },
                  ],
                ],
              ], [
                'div', {
                  class: 'detected__apps',
                },
                amp_supported_apps,
              ],
            ],
          );
        } else {
          amp_not_supported_apps.push(
            [
              'a', {
                class: 'detected__app',
                target: '_blank',
                href: `https://www.wappalyzer.com/technologies/${slugify(appName)}`,
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
                  }, [
                    'img', {
                      class: 'detected__category-pin detected__category-pin--active',
                      src: '../images/pin-active.svg',
                    },
                  ], [
                    'img', {
                      class: 'detected__category-pin detected__category-pin--inactive',
                      src: '../images/pin.svg',
                    },
                  ],
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
    }
    
    template = [
          [
          'div', {
            class: 'amp_supported',
          },
          amp_supported_template,
         ],[
          'div', {
            class: 'amp_not_supported',
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
  ];
  // If it is NOT in list of supported vendors
  return ampSupported.includes(appName);
}