webpackJsonp([0],[
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var angular = __webpack_require__(1);

	var deps = [
	    __webpack_require__(7),
	    __webpack_require__(31),
	    __webpack_require__(33),
	    __webpack_require__(54),
	    __webpack_require__(57)
	];

	console.log('app loaded w/ %o on %o', deps, document);
	module.exports = angular.bootstrap(document, ['cfo-pet-adoption-data-entry']);



/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	var angular = __webpack_require__(1);
	var ngApp = __webpack_require__(8);

	ngApp.config(function ($routeProvider, $locationProvider) {
	    $locationProvider.html5Mode(false);

	    $routeProvider
	        .when('/pets', {
	            template: __webpack_require__(26)
	        })
	        .when('/pets/edit/:speciesName/:petId', {
	            template: __webpack_require__(27)
	        })
	        .when('/pets/new', {
	            template: __webpack_require__(27)
	        })
	        .when('/species', {
	            template: __webpack_require__(28)
	        })
	        .when('/species/:speciesName', {
	            template: __webpack_require__(29)
	        })
	        .when('/species/:speciesName/property/:propName', {
	            template: __webpack_require__(30)
	        })
	        .otherwise({
	            redirectTo: function () {
	                // roundabout way of determining if user is logged in
	                if (angular.element('.main-view').length > 0) {
	                    return '/pets';
	                }

	                return '/';
	            }
	        })
	});

	module.exports = ngApp;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	var angular = __webpack_require__(1);
	var ngRoute = __webpack_require__(9);
	var ngDragDrop = __webpack_require__(11);
	var slickCarousel = __webpack_require__(12);
	var ngMessages = __webpack_require__(13);
	var ngMaterial = __webpack_require__(15);
	// global dependencies
	__webpack_require__(21);
	__webpack_require__(22);
	__webpack_require__(23);

	var ngApp = angular.module('cfo-pet-adoption-data-entry', ['ngMaterial', 'ngMessages', 'ngRoute', 'slickCarousel', 'ngDragDrop'])
	    .config(function ($mdThemingProvider) {
	        $mdThemingProvider.theme('default')
	            .primaryPalette('cyan', {
	                'default': '800'
	            })
	            .accentPalette('teal', {
	                'default': '900'
	            });
	    });

	// ngApp.config(['$compileProvider', function ($compileProvider) {
	//     $compileProvider.debugInfoEnabled(false);
	// }]);

	console.log('loading ng-app: %o', ngApp);
	module.exports = ngApp;


/***/ }),
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var $ = __webpack_require__(3);
	var _ = __webpack_require__(24);

	/**
	 *
	 * @param {HTMLElement} el
	 * @returns {Promise<String[]>}
	 */
	function getFileUrls(el) {
	    var numOfFiles = el.files.length;

	    if (numOfFiles > 0) {
	        var reader = new FileReader();
	        var fileIndex = 0;
	        var images = [];

	        return new Promise(function (resolve, reject) {
	            reader.onload = function (e) {
	                fileIndex++;
	                console.log('file input - reader.onload(%o) - %d/%d', arguments, fileIndex, numOfFiles);
	                images.push(e.target.result);
	                if (fileIndex === numOfFiles) {
	                    console.log('file input - load complete', arguments, fileIndex, numOfFiles);
	                    resolve(images);
	                } else {
	                    reader.readAsDataURL(el.files[fileIndex]);
	                }
	            };

	            reader.readAsDataURL(el.files[fileIndex]);
	        });
	    }

	    return Promise.resolve([]);
	}

	/**
	 *
	 * @returns {Promise<String[]>}
	 */
	$.fn.getUrls = function () {
	    return Promise.all(this.toArray().map(getFileUrls))
	        .then(function (urlCollection) {
	            return Promise.resolve(_.flatten(urlCollection))
	        });

	};

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 24 */,
/* 25 */,
/* 26 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"pet-list\" grid-columns=\"6\"></div>"

/***/ }),
/* 27 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"pet-form\"></div>"

/***/ }),
/* 28 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"species-list\"></div>"

/***/ }),
/* 29 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"species-form\"></div>"

/***/ }),
/* 30 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"species-prop-form\"></div>"

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = [
	    __webpack_require__(32)
	];

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

	var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	ngApp.filter('species', function () {
	    return function (animals, speciesName) {
	        return _.filter(animals, function (animal) {
	            return animal.getSpeciesName() === speciesName;
	        });
	    }
	});

	module.exports = ngApp;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	console.log('loading services');
	module.exports = [
	    __webpack_require__(34),
	    __webpack_require__(38),
	    __webpack_require__(39),
	    __webpack_require__(40),
	    __webpack_require__(44),
	    __webpack_require__(51),
	    __webpack_require__(52),
	    __webpack_require__(53)
	];


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);
	var Animal = __webpack_require__(35);

	module.exports = ngApp.service('animalDataService', function (request) {
	    var self = this;

	    this.animals = {};

	    /**
	     *
	     * @param speciesName
	     * @param {Object} [options]
	     * @param {Boolean} [options.useCache=false]
	     * @return {Promise.<Animal[]>}
	     */
	    this.getAnimalsBySpecies = function (speciesName, options) {
	        var opts = _.defaults(options, {
	            useCache: false
	        });

	        if (opts.useCache && self.animals[speciesName]) {
	            return Promise.resolve(self.animals[speciesName])
	        }

	        return request.get("/api/v1/list/" + speciesName + "?properties=['petId','petName','species','images']")
	            .then(function success(response) {

	                self.animals[speciesName] = response.data.map(function (animalData) {
	                    return new Animal(animalData);
	                });

	                return Promise.resolve(self.animals[speciesName]);
	            })
	    };


	    /**
	     *
	     * @param {Animal} animal
	     * @returns {Promise}
	     */
	    this.deleteAnimal = function (animal) {
	        return request.post('/api/v1/remove/' + animal.getSpeciesName(), animal.toMongooseDoc())
	    };

	    /**
	     *
	     * @param {Animal} animal
	     * @param {Object} [options]
	     * @returns {Promise.<Animal>}
	     */
	    this.fetchAnimal = function (animal, options) {
	        return request.post('/api/v1/query/', animal.toQuery())
	            .then(function success(response) {
	                var fetchedAnimalData = response.data[0];
	                var fetchedAnimal;

	                if (!fetchedAnimalData) {
	                    return Promise.reject(new Error('failed to fetch pet'))
	                }

	                fetchedAnimal = new Animal(fetchedAnimalData);

	                return Promise.resolve(fetchedAnimal);
	            })
	    };

	    this.fetchAnimalById = function (petId) {
	        var animalProps = [
	            {
	                key: 'petId',
	                val: petId
	            }
	        ];
	        var queriedAnimal = new Animal(animalProps);

	        return this.fetchAnimal(queriedAnimal);
	    };

	    /**
	     *
	     * @param {Animal} animal
	     * @param {Object} [options]
	     * @param {Function} [options.isMediaSaved]
	     * @returns {Promise.<Animal>}
	     */
	    this.saveAnimal = function (animal, options) {
	        var formData = new FormData();

	        if (animal.$media) {
	            // append uploaded files
	            _.forEach(animal.$media, function ($inputs, key) {
	                // iterate through each member in $media object
	                $inputs.each(function () {
	                    var fileInputEl = this;

	                    _.forEach(fileInputEl.files, function (file) {
	                        formData.append(key, file);
	                        // TODO only append if filename is saved in props
	                    });
	                })
	            });
	            // we won't be needing the $media anymore - no sense in trying to format it
	            delete animal.$media;
	        }

	        // assign animal values to form data
	        _.forEach(animal.getProps(), function (propData) {
	            if (propData.val !== undefined && propData.val !== null) {

	                if (!propData.key || propData.key === 'undefined'){
	                    console.error('invalid property saved in animal: %o', animal);
	                    throw new Error('attempted to save invalid property');
	                }

	                if (propData.valType === '[Image]') {
	                    // remove temporary images that will be added on upload
	                    propData.val = _.reject(propData.val, function (imageUrl) {
	                        return /^data:/.test(imageUrl);
	                    })
	                }

	                formData.append(propData.key, propData.val);
	            }
	        });

	        return request.post('/api/v1/save/' + animal.getSpeciesName(), formData, {
	                headers: {
	                    // hackish fix for $http to send data with correct format
	                    "Content-Type": undefined
	                }
	            })
	            .then(function success(response) {
	                return Promise.resolve(new Animal(response.data));
	            })
	    };

	    return this;
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),

	    AnimalQuery = __webpack_require__(36),
	    Species = __webpack_require__(37);

	/**
	 *
	 * @extends Species
	 * @class Animal
	 * @param {Species|Object[]|Object} [species] - a Species instance, an array of properties, or an object of species property key-value pairs
	 * @param {Object} [values] - the object of species property key-value pairs
	 * @constructor
	 */
	function Animal(species, values) {
	    var defaultSpeciesName = 'n/a';
	    var defaultSpeciesProps = [];

	    if (species instanceof Species) {
	        Species.call(this, species.getSpeciesName(), species.getSpeciesProps());
	        if (!this.getValue('species')) this.setValue('species', species.getSpeciesName());

	    } else {
	        // species not passed
	        Species.call(this, defaultSpeciesName, defaultSpeciesProps);

	        if (species) {
	            // props or values were passed instead
	            // rename for semantic reasons
	            values = species;
	        }
	    }

	    if (_.isArray(values)) {
	        this.setProps(values);
	    }
	    if (_.isPlainObject(values)) {
	        this.setValues(values);
	    }

	}

	Animal.prototype = {

	    getValue: function (propName) {
	        var prop = _.find(this.props, {key: propName});
	        return prop ? prop.val : null;
	    },

	    getId: function () {
	        return this.getValue('petId')
	    },

	    getSpeciesName: function () {
	        return this.getValue('species')
	    },

	    getName: function () {
	        return this.getValue('petName')
	    },

	    setValue: function (propName, propValue) {
	        var prop;
	        if (propValue.val !== undefined) {
	            // propValue is v1 format and contains metadata
	            prop = this.getProp(propName) || propValue;
	            prop.val = propValue.val;
	        } else {
	            prop = this.getProp(propName) || {key: propName};
	            prop.val = propValue;
	        }
	        this.setProps([prop]);

	        // also set speciesName in doc to reflect species change in both places
	        if (propName === 'species') {
	            this.speciesName = prop.val;
	        }
	    },

	    setValues: function (propData) {
	        var self = this;
	        _.forEach(propData, function (propValue, propName) {
	            self.setValue(propName, propValue);
	        });
	    },

	    toArray: function () {
	        return this.props;
	    },

	    toMongooseDoc: function () {
	        return {
	            petId: this.getValue('petId'),
	            speciesName: this.getSpeciesName(),
	            props: this.getProps().map(function (propData) {
	                switch (propData.valType) {
	                    case 'Number':
	                        propData.val = parseInt(propData.val);
	                        break;
	                    case 'Float':
	                        propData.val = parseFloat(propData.val);
	                        break;
	                    case 'Boolean':
	                        if (!_.isBoolean(propData.val)) {
	                            propData.val = /yes|true/i.test(propData.val)
	                        }
	                        break;
	                    case 'Date':
	                        if (_.isDate(propData.val)) {
	                            propData.val = propData.val.toISOString();
	                        }
	                        break;
	                    default:
	                        break;
	                }
	                return propData;
	            })
	        }
	    },

	    toObject: function (options) {
	        var _options = _.defaults(options, {
	                isV1Format: true
	            }),
	            self = this;
	        return _.reduce(this.props, function (propCollection, propData) {
	            var propValue = propData.val;
	            switch (propData.key) {
	                // skip internal mongodb fields
	                case '_id':
	                case '__v':
	                    return propCollection;
	                    break;
	                case 'petId':
	                    // format animal's mongo ObjectId to string as `petId`
	                    if (propData.val) {
	                        propValue = propData.val.toString();
	                    }
	                    break;
	                default:
	                    break;
	            }

	            switch (propData.valType) {
	                case 'Boolean':
	                    // convert boolean values that are strings to proper boolean value
	                    if (_.isString(propData.val)) {
	                        propValue = /yes|true/i.test(propData.val)
	                    }
	                    break;
	                case 'Date':
	                    if (_.isDate(propData.val)) {
	                        propValue = propData.val.toISOString();
	                    }
	                    break;
	                default:
	                    break;
	            }

	            if (!(propValue === undefined || propValue === null)) {
	                propData.val = propValue;
	                propCollection[propData.key] = _options.isV1Format ? propData : propValue;
	            }
	            return propCollection;
	        }, {});
	    },

	    toLeanObject: function (options) {
	        return this.toObject(_.defaults({isV1Format: false}, options));
	    },

	    toQuery: function (metaProps) {
	        var props = this.toObject();
	        var animalQuery;

	        // merge metaProps if passed in
	        if (metaProps) {
	            props = Object.keys(metaProps).reduce(function (mergedProps, propName) {
	                mergedProps[propName] = metaProps[propName];
	                return mergedProps;
	            }, props)
	        }

	        animalQuery = new AnimalQuery(props, this);

	        return animalQuery.toMongoQuery();
	    }
	};

	_.defaults(Animal.prototype, Species.prototype);

	module.exports = Animal;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24);

	/**
	 * @class QueryProp
	 * @param {Object[]} props
	 * @param {Species} [species]
	 * @returns {Object}
	 * @constructor
	 */
	function Query(props, species) {

	    var self = this;
	    var metaPropNames = ['matchStartFor', 'matchEndFor', 'ignoreCase', 'ignoreCaseFor', 'properties'];
	    var rawQueryMetaProps = _.isArray(props) ? _.filter(props, function (propData, index) {
	        return propData && _.includes(metaPropNames, propData.key)
	    }) : _.pick(props, metaPropNames);

	    this.metaPropNames = metaPropNames;
	    this.species = species;
	    this.props = props;
	    this.queryMeta = _.reduce(rawQueryMetaProps, function (queryMetaProps, metaPropValue, metaPropName) {
	        queryMetaProps[metaPropName] = self.parseArrayStr(metaPropValue);
	        return queryMetaProps;
	    }, {});
	}

	Query.prototype = {

	    toObject: function () {
	        return _.omit(this.props, this.metaPropNames);
	    },

	    toFormattedObject: function () {
	        var self = this;
	        return _.reduce(this.toObject(), function (collection, propData, propIdx) {
	            var propName = propData.key ? propData.key : propIdx;
	            var propValue = propData.key ? propData.val : propData;
	            var propType = self.getPropType(propName, propData);
	            var speciesProp = {};

	            if (self.species) {
	                speciesProp = _.find(self.species.getSpeciesProps(), {key: propName});
	            }

	            switch (propType) {
	                case 'Boolean':
	                    propValue = /^\s*(y|yes|true)\s*$/i.test(propValue);
	                    break;
	                case 'Number':
	                    propValue = parseInt(propValue);
	                    break;
	                case 'Date':
	                    propValue = propValue.toISOString ? propValue.toISOString() : propValue;
	                    break;
	                case 'Float':
	                    propValue = parseFloat(propValue);
	                    break;
	            }

	            collection[propName] = _.defaults({
	                key: propName,
	                valType: propType,
	                val: propValue
	            }, speciesProp);

	            return collection;
	        }, {});
	    },

	    toMongoQuery: function () {
	        var self = this,
	            query = {},
	            queryMeta = this.queryMeta,
	            props = _.reduce(this.toFormattedObject(), function (mongoQueryProps, propData) {
	                var propValue = propData.val,
	                    propName = propData.key;

	                switch (propName) {
	                    case 'petId':
	                    case 'hashId':
	                    case '_id':
	                        // only use given id and quit early
	                        mongoQueryProps = {
	                            petId: propValue.toString()
	                        };
	                        break;
	                    case 'species':
	                        if (_.isRegExp(propValue)) {
	                            mongoQueryProps[propName] = propValue;
	                        } else {
	                            mongoQueryProps[propName] = new RegExp(propValue.toString(), 'i');
	                        }
	                        break;
	                    case 'images':
	                        // ignore images
	                        break;
	                    default:

	                        if (self.isPropRegex(propData)) {
	                            var prefix = '',
	                                suffix = '',
	                                regexArgs = '';
	                            if (queryMeta.matchStartFor && _.includes(queryMeta.matchStartFor, propName)) {
	                                prefix = '^';
	                            }
	                            if (queryMeta.matchEndFor && _.includes(queryMeta.matchEndFor, propName)) {
	                                suffix = '$';
	                            }
	                            if (queryMeta.ignoreCase && _.includes(queryMeta.ignoreCase, propName)
	                                || queryMeta.ignoreCaseFor && _.includes(queryMeta.ignoreCaseFor, propName)) {
	                                regexArgs = 'i';
	                            }
	                            if (propName == 'color' || propName == 'petName') {
	                                // ignore case for color,petName searches
	                                regexArgs = 'i';
	                            }
	                            mongoQueryProps[propName] = new RegExp(prefix + self.escapeRegExp(propValue) + suffix, regexArgs);
	                        } else {
	                            mongoQueryProps[propName] = propValue;
	                        }
	                        break;
	                }
	                return mongoQueryProps;
	            }, {});

	        if (props._id || props.petId) {
	            query = {
	                petId: props._id || props.petId
	            };
	        } else if (_.keys(props).length == 0) {
	            query = {}
	        } else {
	            query = {
	                props: {
	                    $all: _.reduce(props, function (propsCollection, propValue, propName) {
	                        propsCollection.push({
	                            $elemMatch: {
	                                key: propName,
	                                val: propValue
	                            }
	                        });
	                        return propsCollection;
	                    }, [])
	                }
	            };
	        }

	        return query;
	    },

	    getPropType: function (propName, propData) {
	        var propValue = propData.key ? propData.val : propData;

	        if (this.species && this.species.getProp(propName)) {
	            return this.species.getProp(propName).valType;

	        } else if (propData.valType) {
	            return propData.valType;

	        } else if (_.isDate(propValue)) {
	            return 'Date'

	        } else if (_.isFinite(propValue)) {
	            return 'Number';

	        } else if (_.isNumber(propValue)) {
	            return 'Float';

	        } else if (propValue && /^\s*(y|yes|true|n|no|false)\s*$/i.test(propValue.toString())) {
	            return 'Boolean';

	        } else {
	            return null;
	        }
	    },

	    isPropRegex: function (propData) {
	        var self = this,
	            isString = propData.valType && propData.valType.toLowerCase() == 'string' && !_.isRegExp(propData.val),
	            hasMeta = (function () {
	                var result = false;
	                _.forEach(self.queryMeta, function (queryMetaValue) {
	                    if (_.includes(queryMetaValue, propData.key)) {
	                        result = true;
	                        return false;
	                    }
	                });
	                return result;
	            })();
	        return isString || hasMeta;
	    },

	    escapeRegExp: function (str) {
	        return str.toString().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	    },

	    parseArrayStr: function (str) {
	        try {
	            var _result = str
	                .replace(/^\[[\'\"]?/, '')
	                .replace(/[\'\"]?]$/, '')
	                .replace(/[\'\"]/g, '')
	                .split(',');
	            return (_.isArray(_result)) ? _result : false;
	        } catch (err) {

	        }
	        return false;
	    }
	};

	module.exports = Query;


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24);

	/**
	 * @class Species
	 * @param {String} speciesName
	 * @param {Object[]|String} data
	 * @constructor
	 */
	function Species(speciesName, data) {
	    var parsedData;

	    this.speciesName = speciesName;
	    this.baseProps = [
	        {
	            key: 'petId',
	            valType: 'String',
	            fieldLabel: "Pet ID",
	            example: '',
	            defaultVal: [],
	            description: 'identifier',
	            note: '',
	            required: true,
	            options: []
	        },
	        {
	            key: 'species',
	            valType: 'String',
	            fieldLabel: "Animal's Species",
	            example: 'dog',
	            defaultVal: speciesName,
	            description: 'Species of the animal',
	            note: '',
	            required: true,
	            options: [speciesName]
	        },
	        {
	            key: 'images',
	            valType: '[Image]',
	            fieldLabel: "Pet images",
	            example: ['http://placehold.it/500x500'],
	            defaultVal: [],
	            description: 'Images of the animal',
	            note: '',
	            required: false,
	            options: []
	        },
	        {
	            key: 'petName',
	            valType: 'String',
	            fieldLabel: 'Pet\'s name',
	            example: 'Fido',
	            defaultVal: '',
	            description: 'Pet\'s name',
	            note: '',
	            required: false,
	            options: []
	        }
	    ];
	    this.props = this.baseProps.slice();

	    if (data) {
	        if (_.isString(data)) {
	            parsedData = JSON.parse(data);
	        } else {
	            parsedData = data;
	        }

	        this.setProps(parsedData.props || parsedData);

	        if (parsedData.speciesName) {
	            this.speciesName = parsedData.speciesName;
	        }
	    }
	}

	Species.prototype = {

	    /**
	     *
	     * @returns {String} - name of the species
	     */
	    getSpeciesName: function () {
	        return this.speciesName
	    },

	    /**
	     *
	     * @param {Object[]} props - an array of properties to overwrite/insert
	     */
	    setProps: function (props) {
	        var self = this;
	        if (!props) {
	            console.error('[%o].setProps() received invalid props', this);
	            return;
	        }
	        props.forEach(function (propData) {
	            var prevPropIndex = _.findIndex(self.props, {key: propData.key});
	            if (prevPropIndex >= 0) {
	                self.props[prevPropIndex] = _.defaults({}, propData, self.props[prevPropIndex]);
	                return;
	            }

	            // NOTE Object.assign is to add copy rather than reference of propData
	            self.props.push(Object.assign({}, propData));
	        });
	    },

	    /**
	     *
	     * @param {String|Number} propIndex - key name or index of property to remove
	     */
	    removeProp: function (propIndex) {
	        this.props = _.reject(this.props, function (propData, idx) {
	            if (_.isString(propIndex)) {
	                return propData.key === propIndex;
	            }

	            if (_.isNumber(propIndex)) {
	                return idx === propIndex;
	            }

	            return false;
	        });
	    },

	    /**
	     *
	     * @param {String} propName - key name of the species property
	     * @returns {Object} - the specified species property object
	     */
	    getProp: function (propName) {
	        return _.find(this.props, {key: propName});
	    },

	    /**
	     *
	     * @param {Object} [options]
	     * @param {Boolean} [options.removesValues=false] - whether to remove values from properties
	     * @returns {Object[]} - an array containing the animal's properties
	     */
	    getProps: function (options) {
	        var opts = _.defaults(options, {removeValues: false});

	        return _.chain(this.props)
	            .reduce(function (props, speciesPropData) {
	                // fix for bad default location values
	                if (speciesPropData.valType === 'Location' && !_.isNumber(speciesPropData.defaultVal)) {
	                    speciesPropData.defaultVal = -1;
	                }

	                // remove any duplicate options
	                if (speciesPropData.options) {
	                    speciesPropData.options = _.chain(speciesPropData.options)
	                        .uniq()
	                        .sortBy(function (option) {
	                            return option
	                        })
	                        .value()
	                }

	                props.push(speciesPropData);
	                return props
	            }, [])
	            .map(function (propData) {
	                return opts.removeValues ? _.omit(propData, ['val']) : propData;
	            })
	            .sortBy(function (propData) {
	                switch (propData.key) {
	                    case 'petId':
	                        return 0;
	                    case 'images':
	                        return 1;
	                    case 'petName':
	                        return 2;
	                    case 'species':
	                        return 3;
	                    default:
	                        return propData.key;
	                }
	            })
	            .value();
	    },

	    getSpeciesProps: function () {
	        return this.getProps({removeValues: true});
	    },

	    /**
	     *
	     * @param {Object} [options]
	     * @param {Boolean} [options.removesValues=false] - whether to remove values from properties
	     * @returns {{speciesName: (String), props: (Object[])}} - an object formatted for saving in mongodb
	     */
	    toMongooseDoc: function (options) {
	        return {
	            speciesName: this.getSpeciesName(),
	            props: this.getProps(options)
	        }
	    }
	};

	module.exports = Species;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var _ = __webpack_require__(24);
	var ngApp = __webpack_require__(8);

	var Species = __webpack_require__(37);

	module.exports = ngApp.service('speciesDataService', function (request, speciesFactory) {
	    var self = this;
	    this.animalSpecies = {};


	    /**
	     *
	     * @param {Object} [options]
	     * @param {Boolean} [options.useCache=false]
	     * @returns {Promise.<String[]>}
	     */
	    this.getSpeciesList = function (options) {
	        var _options = _.defaults(options, {
	            useCache: false
	        });

	        if (_options.useCache && this.speciesList) {
	            return Promise.resolve(this.speciesList);
	        }

	        return request.get('/api/v1/species/')
	            .then(function success(response) {
	                self.speciesList = response.data;
	                return Promise.resolve(self.speciesList);
	            })
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {Object} [options]
	     * @param {Boolean} [options.useCache=false]
	     * @returns {Promise.<Species>}
	     */
	    this.getSpecies = function (speciesName, options) {
	        var _options = _.defaults(options, {
	            useCache: false
	        });
	        var cachedSpecies;

	        if (!speciesName) {
	            return Promise.reject(new Error('invalid species specified'));
	        }

	        if (_options.useCache && this.animalSpecies[speciesName]) {
	            cachedSpecies = this.animalSpecies[speciesName];
	            return Promise.resolve(new Species(cachedSpecies.getSpeciesName(), cachedSpecies.getSpeciesProps()));
	        }

	        return request.get('/api/v1/model/' + speciesName)
	            .then(function success(response) {

	                self.animalSpecies[speciesName] = new Species(speciesName, response.data);

	                return Promise.resolve(self.animalSpecies[speciesName]);
	            })
	    };

	    /**
	     *
	     * @param {Species} species
	     * @param {Object} [options]
	     * @returns {Promise.<Species>}
	     */
	    this.saveSpecies = function (species, options) {
	        var _options = _.defaults(options, {});
	        var speciesName = species.getSpeciesName();

	        return request.post('/api/v1/save/' + speciesName + '/model/', species.toMongooseDoc({removeValues: true}))
	            .then(function (response) {
	                var speciesData = response.data;

	                self.animalSpecies[speciesName] = new Species(speciesName, speciesData);

	                return Promise.resolve(self.animalSpecies[speciesName]);
	            })
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {Object} [options]
	     * @param {Object[]} [options.speciesProps=[]]
	     * @returns {Promise.<Species>}
	     */
	    this.createSpecies = function (speciesName, options) {
	        var sanitizedSpeciesName = _.kebabCase(speciesName);
	        var opts = _.defaults(options, {
	            speciesProps: []
	        });
	        var newSpecies;

	        if (this.animalSpecies[sanitizedSpeciesName]) {
	            return Promise.resolve(this.animalSpecies[sanitizedSpeciesName]);
	        }

	        newSpecies = speciesFactory.createTemplate(sanitizedSpeciesName, opts.speciesProps);


	        return request.post('/api/v1/create/' + newSpecies.getSpeciesName() + '/model', newSpecies.getSpeciesProps())
	            .then(function success(response) {
	                var speciesProps = response.data;

	                self.animalSpecies[sanitizedSpeciesName] = new Species(sanitizedSpeciesName, speciesProps);
	                self.getSpeciesList()
	                    .catch(function (err) {
	                        console.error(err);
	                    });

	                return Promise.resolve(self.animalSpecies[sanitizedSpeciesName]);
	            })
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {Object} [options]
	     * @param {Boolean} [options.updateSpeciesList=true]
	     * @returns {Promise}
	     */
	    this.deleteSpecies = function (speciesName, options) {
	        var opts = _.defaults(options, {
	            updateSpeciesList: true
	        });

	        return request.post('/api/v1/remove/' + speciesName + '/model')
	            .then(function success(response) {

	                if (opts.updateSpeciesList) {
	                    self.getSpeciesList({useCache: false})
	                }

	                return Promise.resolve(response);
	            })
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {String} propName
	     * @param {Object} [options]
	     * @returns {Promise}
	     */
	    this.deleteSpeciesProp = function (speciesName, propName, options) {
	        this.animalSpecies[speciesName].removeProp(propName);
	        return this.saveSpecies(this.animalSpecies[speciesName], options);
	    };

	    /**
	     *
	     * @param {String|Object} speciesName
	     * @param {String} propName
	     * @returns {Object} - the prop as defined by the species
	     */
	    this.getSpeciesProp = function (speciesName, propName) {
	        return this.animalSpecies[speciesName].getProp(propName);
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {Object} propData
	     */
	    this.setSpeciesProp = function (speciesName, propData) {
	        debugger;
	        this.animalSpecies[speciesName].setProps([propData])
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {Object} propData
	     * @returns {Promise.<Species>}
	     */
	    this.saveSpeciesProp = function (speciesName, propData) {
	        this.setSpeciesProp(speciesName, propData);
	        return this.saveSpecies(this.animalSpecies[speciesName]);
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {String} propName
	     * @param {Object} options
	     * @returns {Promise}
	     */
	    this.createSpeciesProp = function (speciesName, propName, options) {
	        var species = this.animalSpecies[speciesName];
	        var propData = _.defaults(options, {
	            key: propName,
	            valType: 'String',
	            defaultVal: '',
	            fieldLabel: '',
	            note: '',
	            description: '',
	            example: '',
	            options: []
	        });

	        if (species.getProp(speciesName, propName)) {
	            return false;
	        }

	        species.setProps([propData]);

	        return self.saveSpecies(species);
	    };

	    /**
	     *
	     * @param {String} speciesName
	     * @param {HTMLElement} fileInput
	     * @param {Object} [options]
	     * @param {Object} [options.headers]
	     * @return {Promise}
	     */
	    this.saveSpeciesPlaceholder = function (speciesName, fileInput, options) {
	        var opts = _.defaults(options, {
	            headers: {
	                "Content-Type": undefined
	            }
	        });
	        var formData = new FormData();
	        var requestParams = {headers: opts.headers};

	        _.forEach(fileInput.files, function (file) {
	            formData.append("placeholder", file);
	        });

	        return request.post('/api/v1/save/' + speciesName + '/placeholder', formData, requestParams)
	            .catch(function failure(err) {
	                var errMessage = "Could not save placeholder";

	                return Promise.reject(new Error(errMessage));
	            })
	    };

	    return this;
	});


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var angular = __webpack_require__(1);
	var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	module.exports = ngApp.service('userService', function (request) {
	    var self = this;

	    this.user = {
	        // Get user ID
	    };

	    /**
	     *
	     * @param propName
	     */
	    this.getUserDefault = function (propName) {
	        return _.find(this.user.defaults, {key: propName});
	    };

	    this.getUserDefaults = function () {
	        return this.user.defaults;
	    };

	    /**
	     *
	     * @param propData
	     */
	    this.addUserDefault = function (propData) {
	        this.user.defaults.push(_.pick(propData, ['key', 'val']));
	    };

	    /**
	     *
	     * @param propData
	     */
	    this.updateUserDefault = function (propData) {
	        var propDefault = _.find(this.user.defaults, function (propDefaultData) {
	            return propDefaultData.key == propData.key;
	        });
	        propDefault = _.pick(propData, ['key', 'val']);
	    };

	    /**
	     *
	     * @param propData
	     */
	    this.setUserDefault = function (propData) {
	        var currentDefault = this.getUserDefault(propData.key);
	        if (!currentDefault) {
	            this.addUserDefault(propData);
	        } else {
	            this.updateUserDefault(propData);
	        }
	    };

	    /**
	     *
	     * @param {String} propName
	     * @param {Number} priorityVal
	     */
	    this.setUserAnimalPropertyOrder = function (propName, priorityVal) {
	        var propOrderData = _.find(this.user.meta, function (metaProp) {
	            return metaProp.name == 'propOrder';
	        });
	        // define if not set
	        if (!propOrderData) {
	            propOrderData = {name: 'propOrder', value: '{}'};
	            this.user.meta.push(propOrderData);
	        }
	        var propOrderValue = JSON.parse(propOrderData.value);
	        propOrderValue[propName] = priorityVal;
	        propOrderData.value = JSON.stringify(propOrderValue);
	    };

	    /**
	     *
	     * @param {String} propName
	     * @param {Number} priorityVal
	     * @returns {Promise}
	     */
	    this.saveUserAnimalPropertyOrder = function(propName, priorityVal){
	        this.setUserAnimalPropertyOrder(propName, priorityVal);
	        return this.saveCurrentUser();
	    };

	    this.setUserAnimalPropertiesOrder = function (propPriorities) {
	        _.forEach(propPriorities, function (propOrderVal, propName) {
	            self.setUserAnimalPropertyOrder(propName, propOrderVal);
	        });
	    };

	    this.getUserAnimalPropertiesOrder = function () {
	        var propPriorities = _.find(this.user.meta, function (metaProp) {
	            return metaProp.name == 'propOrder';
	        });
	        // define if not set
	        if (!propPriorities) {
	            propPriorities = {name: 'propOrder', value: '{}'};
	            this.user.meta.push(propPriorities);
	        }
	        return JSON.parse(propPriorities.value);
	    };

	    this.getPropPriority = function (propName) {
	        var propPriorities = this.getUserAnimalPropertiesOrder();
	        return propPriorities[propName];
	    };

	    this.sortSpeciesProps = function (props) {
	        var propPriorities = _.defaults(this.getUserAnimalPropertiesOrder(), {
	            petId: 0,
	            images: 1,
	            petName: 2,
	            species: 3
	        });
	        return _.sortBy(props, function (propData) {
	            // default to prop order in not specified
	            return propPriorities[propData.key] ? propPriorities[propData.key] : props.length - 1;
	        })
	    };

	    /**
	     * @returns {Promise}
	     **/
	    this.saveCurrentUser = function () {
	        return request.post('/api/v1/user/save', this.user)
	            .catch(function failure(err) {
	                console.error(err || new Error('Could not save user'));
	                return Promise.reject(err);
	            });
	    };


	    /**
	     * @param {Object} options
	     * @returns {Promise}
	     **/
	    this.getCurrentUser = function (options) {
	        var _options = _.defaults(options, {});

	        return request.get('/api/v1/user')
	            .then(function success(response) {
	                self.user = response.data;
	                return Promise.resolve(self.user);
	            })
	            .catch(function failure(err) {
	                console.error(err);
	                return Promise.reject(err);
	            });
	    };
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise, $) {var async = __webpack_require__(41);
	var _ = __webpack_require__(24);
	var angular = __webpack_require__(1);

	var ngApp = __webpack_require__(8);

	module.exports = ngApp.service('media', function () {

	    /**
	     *
	     * @param {HTMLInputElement} inputEl
	     * @returns {Promise<String[]>}
	     */
	    this.getInputURLs = function (inputEl) {
	        var numOfFiles = inputEl.files.length;
	        var urls = [];
	        var reader;
	        var fileIndex;

	        if (numOfFiles > 0) {
	            reader = new FileReader();
	            fileIndex = 0;

	            return new Promise(function (resolve) {
	                reader.onload = function (e) {
	                    urls.push(e.target.result);

	                    if (fileIndex === numOfFiles) {
	                        resolve(urls);
	                    } else {
	                        reader.readAsDataURL(inputEl.files[fileIndex++]);
	                    }
	                };

	                reader.readAsDataURL(inputEl.files[fileIndex]);
	            });
	        }

	        return Promise.resolve([]);
	    };

	    /**
	     *
	     * @param {String|jQuery} fileInputSelector
	     * @returns {Promise.<String[]>}
	     */
	    this.getFileInputValues = function (fileInputSelector) {
	        var self = this;
	        var $fileInputs = fileInputSelector.jquery ? fileInputSelector : $(fileInputSelector);

	        return Promise.all($fileInputs.map(self.getInputURLs))
	            .then(function (results) {
	                return Promise.resolve(_.flatten(results));
	            });
	    };


	    /**
	     *
	     * @param {Animal} animal
	     * @param {String|jQuery} fileInputSelector
	     * @returns {FormData}
	     */
	    this.generateAnimalPostFormData = function (animal, fileInputSelector) {
	        var animalFormData = new FormData();
	        var $inputs = fileInputSelector.jquery ? fileInputSelector : angular.element(fileInputSelector || "input[type='file']");

	        if ($inputs.length) {
	            // append uploaded files
	            $inputs.each(function ($el) {
	                var fileInputEl = $el[0];
	                _.forEach(fileInputEl.files, function (file) {
	                    // TODO only append if filename is saved in props
	                    animalFormData.append(file.name, file);
	                });
	            });
	        }

	        return _.reduce(animal.toJSON(), function (formData, animalPropertyValue, animalPropertyName) {
	            if (animalPropertyValue != undefined && animalPropertyValue != null) {
	                formData.append(animalPropertyName, animalPropertyValue);
	            }
	            return formData;
	        }, animalFormData);

	    };
	});

	module.exports = ngApp;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4), __webpack_require__(3)))

/***/ }),
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var ngApp = __webpack_require__(8),
	    angular = __webpack_require__(1),
	    url = __webpack_require__(45);

	ngApp.service('addressFinderService', ['googleService', function (googleService) {
	    var $mapsScript = angular.element("script[src*='maps.googleapis.com/maps/api/js']"),
	        mapsKey = url.parse($mapsScript.attr('src')).query['key'];

	    /**
	     *
	     * @param {String} address
	     * @returns {Promise}
	     */
	    this.findCoordinates = function (address) {
	        if (!mapsKey) {
	            return Promise.reject(new Error('Maps key not provided'));
	        }

	        return googleService.initGoogleServices()
	            .then(function () {
	                var geocoder = new google.maps.Geocoder();

	                return new Promise(function (resolve, reject) {
	                    geocoder.geocode({'address': address}, function (results, status) {
	                        console.log('geocodeAddress(%s) =', address, arguments);
	                        switch (status) {
	                            case 'OK':
	                                var locationResult = results[0];
	                                resolve({
	                                    address: locationResult['formatted_address'],
	                                    lat: locationResult.geometry.location.lat(),
	                                    lng: locationResult.geometry.location.lng()
	                                });
	                                return;
	                            case 'ZERO_RESULTS':
	                            default:
	                                reject(new Error('No results found'));
	                                return;
	                        }
	                    });
	                })
	            });

	    };

	    return this;
	}]);

	module.exports = ngApp;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

	var ngApp = __webpack_require__(8);
	var Species = __webpack_require__(37);
	var _ = __webpack_require__(24);

	ngApp.service('speciesFactory', function () {

	    function SpeciesFactory() {

	    }

	    SpeciesFactory.prototype = {
	        createTemplate: function (speciesName, props) {
	            return new Species(speciesName, props);
	        }
	    };

	    return new SpeciesFactory();
	});

	module.exports = ngApp;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	ngApp.service('request', function ($http, $mdToast) {
	    var timeoutLimit = 10 * 1000;

	    Request.onTimeout = function () {
	        $mdToast.show($mdToast.simple().textContent("Poor connection detected"));
	    };

	    Request.get = function () {
	        var self = this;
	        var timeoutId = setTimeout(function () {
	            self.onTimeout();
	        }, timeoutLimit);

	        return $http.get.apply($http, arguments)
	            .then(function (response) {
	                clearTimeout(timeoutId);
	                return Promise.resolve(response);
	            })
	            .catch(function (response) {
	                var statusCode = parseInt(response.status);

	                clearTimeout(timeoutId);
	                switch (statusCode) {
	                    case 401:
	                        // location.href = '/auth/google';
	                        $mdToast.show($mdToast.simple().textContent("User not authorized"));
	                        break;
	                    default:
	                        if (statusCode >= 400) {
	                            $mdToast.show($mdToast.simple().textContent("Cannot connect to server"));
	                        }
	                }

	                return Promise.reject(response);
	            });
	    };

	    Request.post = function () {
	        var self = this;
	        var timeoutId = setTimeout(function () {
	            self.onTimeout();
	        }, timeoutLimit);

	        return $http.post.apply($http, arguments)
	            .then(function (response) {
	                clearTimeout(timeoutId);
	                return Promise.resolve(response);
	            })
	            .catch(function (response) {
	                var statusCode = parseInt(response.status);

	                clearTimeout(timeoutId);
	                switch (statusCode) {
	                    case 401:
	                        location.href = '/auth/google';
	                        break;
	                }

	                if (statusCode >= 400) {
	                    $mdToast.show($mdToast.simple().textContent("Cannot connect to server"));
	                    return Promise.reject(response);
	                }

	                return Promise.reject(response);
	            });
	    };

	    return Request;
	});

	module.exports = ngApp;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(Promise) {!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__,
	    __webpack_require__(8)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (require) {

	    return __webpack_require__(8).service('googleService', function () {
	        var self = this;
	        var googleCheckInterval;
	        var googleCheckTimeout;

	        this.TIMEOUT = 10 * 1000;
	        this.POLL_FREQUENCY = 1000;

	        function isGoogleInit() {
	            return window.google && window.google.maps;
	        }

	        function wait() {
	            return new Promise(function (resolve, reject) {
	                googleCheckTimeout = setTimeout(function () {
	                    var timeoutEror = new Error('Could not load google maps');

	                    clearInterval(googleCheckTimeout);
	                    console.error(timeoutEror);

	                    reject(timeoutEror);
	                }, self.TIMEOUT);

	                googleCheckInterval = setInterval(function () {
	                    if (isGoogleInit()) {

	                        clearTimeout(googleCheckTimeout);
	                        clearInterval(googleCheckInterval);

	                        resolve();
	                    }
	                }, self.POLL_FREQUENCY);
	            });
	        }

	        this.initGoogleServices = function () {
	            return wait();
	        };

	        return this;
	    })
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

	console.log('loading controllers');
	module.exports = [
	    __webpack_require__(55),
	    __webpack_require__(56)
	];


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);
	var angular = __webpack_require__(1);

	console.log('loading app controller w/ %o', ngApp);

	module.exports = ngApp.controller('appController', function ($scope, request, $mdToast, $location, userService) {
	    console.log('init app controller');
	    angular.element('.loading-text').remove();
	    $scope.loadingQueue = {
	        length: 0
	    };

	    $scope.sideNav = {
	        isOpen: false
	    };

	    $scope.resetActionMenu = function(){
	        $scope.actionMenu = {actions : []};
	    };

	    $scope.login = function () {
	        location.href = '/auth/google';
	    };

	    /**
	     *
	     * @param {String} errorMessage
	     */
	    $scope.showError = function (errorMessage) {
	        return $mdToast.show($mdToast.simple().textContent(errorMessage || 'Sorry. Try Again :-('));
	    };
	    /**
	     *
	     * @param {String} message
	     */
	    $scope.showMessage = function (message) {
	        return $mdToast.show($mdToast.simple().textContent(message || 'Success'))
	            .catch(function (err) {
	                console.error('$mdToast err: %o', err)
	                return Promise.resolve();
	            });
	    };

	    $scope.showLoading = function () {
	        $scope.loadingQueue.length++;
	        return Promise.resolve();
	    };

	    $scope.hideLoading = function () {
	        if ($scope.loadingQueue.length > 0) $scope.loadingQueue.length--;
	        return Promise.resolve();
	    };

	    $scope._persistCurrentPath = function () {
	        $location.path($location.path());
	    };

	    $scope.showAnimalSearch = function () {
	        $location.path('/pets/');
	        $scope.closeSidebar();
	    };

	    $scope.showAnimalEditForm = function () {
	        $location.path('/pets/new');
	        $scope.closeSidebar();
	    };

	    /**
	     *
	     * @param {Animal} animal
	     */
	    $scope.editPet = function (animal) {
	        $location.path('/pets/edit/' + animal.getSpeciesName() + '/' + animal.getId());
	    };

	    $scope.editProp = function (speciesName, propData) {
	        $location.path('species/' + speciesName + '/property/' + propData.key);
	    };

	    $scope.showSpeciesSearch = function () {
	        $location.path('/species');
	        $scope.closeSidebar();
	    };

	    $scope.showSpecies = function (speciesName) {
	        $location.path('/species/' + speciesName);
	        $scope.closeSidebar();
	    };

	    $scope.onTabSelected = function (tab) {
	        $scope.$broadcast('change:tab', tab);
	    };

	    $scope.toggleMenu = function ($mdOpenMenu, ev) {
	        $mdOpenMenu(ev);
	    };

	    $scope.toggleSidebar = function () {
	        $scope.sideNav.isOpen = !$scope.sideNav.isOpen;
	    };

	    $scope.closeSidebar = function () {
	        $scope.sideNav.isOpen = false;
	    };

	    $scope.refreshApp = function () {
	        $scope.$broadcast('reload:app');
	    };


	    $scope.toggleActionMenu = function () {
	        console.log('$scope.$broadcast(toggle:action-menu)');
	        $scope.$broadcast('toggle:action-menu');
	    };


	    (function init() {
	        $scope.resetActionMenu();

	        $scope.$on('$routeChangeSuccess', function(next, current) {
	            $scope.resetActionMenu();
	        });

	        userService.getCurrentUser()
	            .then(function (user) {
	                $scope.user = user;
	            })
	    })()
	})

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

	var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	ngApp.controller('formController', [
	    '$scope',
	    function ($scope) {

	        $scope.getPropType = function (propData) {
	            if (!propData) return 'invalid';

	            switch (propData.key) {
	                case 'petId':
	                    return 'hidden';
	                case 'species':
	                    return 'select';
	                case 'description':
	                    return 'textarea';
	                default:
	                    break;
	            }

	            switch (propData.valType) {
	                case 'Location':
	                    return 'location';
	                case '[Image]':
	                    return 'gallery';
	                case 'Date':
	                    return 'date';
	                case 'Number':
	                    return 'number';
	                case 'Boolean':
	                    return 'boolean';
	                default:
	                    return 'string';
	            }
	        };

	        $scope.isPropResetable = function (propData) {
	            switch (propData.valType) {
	                case 'String':
	                case 'Number':
	                case 'Date':
	                    return true;
	                default:
	                    return false;
	            }
	        };

	        $scope.getSelectOptionLabel = function (option) {
	            if (option === true) {
	                return 'Yes';
	            } else if (option === false) {
	                return 'No'
	            } else {
	                return option;
	            }

	        };

	    }])

	module.exports = ngApp;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

	console.log('loading directives');

	module.exports = [
	    __webpack_require__(58),
	    __webpack_require__(60),
	    __webpack_require__(62),
	    __webpack_require__(64),
	    __webpack_require__(66),
	    __webpack_require__(68),
	    __webpack_require__(70),
	    __webpack_require__(72),
	    __webpack_require__(73),
	    __webpack_require__(75),
	    __webpack_require__(77),
	    __webpack_require__(79),
	    __webpack_require__(81),
	    __webpack_require__(84),
	    __webpack_require__(87),
	    __webpack_require__(90),
	    __webpack_require__(209)
	];


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),
	    ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('actionMenu', function () {
	    return {
	        restrict: 'C',
	        scope: '@',
	        controller: function ($scope, $mdBottomSheet) {

	            $scope.state = {
	                isVisible: false
	            };

	            function onBottomSheetClosed() {
	                $scope.state.isVisible = false;
	            }

	            $scope.showBottomSheet = function () {
	                $mdBottomSheet.show({
	                    template: __webpack_require__(59),
	                    controller: function () {
	                        console.log('actionMenu.bottomSheet.controller()', arguments);
	                        $scope.state.isVisible = true;
	                    },
	                    scope: $scope,
	                    preserveScope: true
	                }).then(
	                    function () {
	                        console.log('clicked %o', arguments);
	                    },
	                    function cancelled() {
	                        console.log('cancelled');
	                        onBottomSheetClosed();
	                    });
	            };

	            $scope.closeBottomSheet = function () {
	                $mdBottomSheet.hide();
	                onBottomSheetClosed();
	            };

	            $scope.$on('toggle:action-menu', function () {
	                console.log('$scope.$on(toggle:action-menu)');
	                if (!$scope.state.isVisible) {
	                    $scope.showBottomSheet();
	                } else {
	                    $scope.closeBottomSheet();
	                }
	            })
	        }
	    };
	});


/***/ }),
/* 59 */
/***/ (function(module, exports) {

	module.exports = "<md-bottom-sheet class=\"md-grid\" layout=\"column\"><div ng-cloak><md-list flex layout=\"row\" layout-align=\"center center\"><md-list-item ng-repeat=\"action in actionMenu.actions\"><div><md-button class=\"md-grid-item-content action action--bottommenu\" ng-click=\"action.onClick(); closeBottomSheet();\"><md-icon class=\"material-icons\">{{action.icon}}</md-icon><div class=\"md-grid-text\">{{action.label}}</div></md-button></div></md-list-item></md-list></div></md-bottom-sheet>"

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),
	    ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('autoInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(61),
	        controller: function ($scope) {

	            $scope.getType = function (propData) {
	                return $scope.getPropType(propData || $scope.propData);
	            };

	            $scope.isResetable = function (propData) {
	                return $scope.isPropResetable(propData || $scope.propData);
	            }

	        }
	    }
	})


/***/ }),
/* 61 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"auto-input__content\" ng-switch=\"getType()\"><div class=\"images-input gallery\" ng-switch-when=\"gallery\"></div><div class=\"date-input\" ng-switch-when=\"date\"></div><div class=\"location-input\" ng-switch-when=\"location\"></div><div class=\"textarea-input\" ng-switch-when=\"textarea\"></div><div class=\"autocomplete-input\" ng-switch-when=\"string\"></div><div class=\"select-input\" ng-switch-when=\"select\"></div><div class=\"select-input\" ng-switch-when=\"boolean\"></div><div class=\"number-input\" ng-switch-when=\"number\"></div><div class=\"button button--set-default\" ng-if=\"isResetable()\" ng-click=\"setUserDefault(propData)\"></div></div>"

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),
	    ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('defaultSpeciesPropInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(63),
	        controller: function ($scope) {
	            $scope.getType = function () {
	                return $scope.getPropType($scope.propData);
	            }
	        }
	    }
	});


/***/ }),
/* 63 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"auto-input__content\" ng-switch=\"getType()\"><div class=\"input input--date\" ng-switch-when=\"date\"><label class=\"input__label\">The default value</label><md-datepicker ng-model=\"propData.defaultVal\"></md-datepicker></div><div class=\"input input--number\" ng-switch-when=\"number\"><md-input-container class=\"md-block\"><label>The default value</label><input ng-model=\"propData.defaultVal\" ng-pattern=\"/^[0-9.]*$/\"><div ng-messages=\"propData.defaultVal.$error\" role=\"alert\"><div ng-message=\"pattern\">Not a valid value</div></div></md-input-container></div><div class=\"input input--textarea\" ng-switch-when=\"textarea\"><md-input-container class=\"md-block\"><label>The default value</label><textarea ng-model=\"propData.val\" max-rows=\"8\" md-select-on-focus></textarea></md-input-container></div><div class=\"input input--autocomplete\" ng-switch-when=\"string\"><md-autocomplete class=\"input-options\" md-search-text=\"propData.defaultVal\" md-items=\"option in propData.options | filter:propData.defaultVal\" md-min-length=\"1\" md-delay=\"250\" md-floating-label=\"The Default Value\"><md-item-template><span ng-bind=\"option\"></span></md-item-template></md-autocomplete></div><div class=\"input input--select\" ng-switch-when=\"select\"><md-input-container class=\"md-block\"><label>The default value</label><md-select ng-model=\"propData.defaultVal\"><md-option ng-value=\"option\" ng-repeat=\"option in propData.options\">option</md-option></md-select></md-input-container></div><div class=\"input input--boolean\" ng-switch-when=\"boolean\"><md-input-container class=\"md-block\"><label>The default value</label><md-select ng-model=\"propData.defaultVal\"><md-option ng-value=\"true\">{{getSelectOptionLabel(true)}}</md-option><md-option ng-value=\"false\">{{getSelectOptionLabel(false)}}</md-option></md-select></md-input-container></div></div>"

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24);
	var ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('fileInput', function () {
	    return {
	        restrict: 'EC',
	        scope: {
	            onFileInputChangeCallback: '&onFileInputChange',
	            upload: '=trigger',
	            inputLimit: '@'
	        },
	        transclude: true,
	        template: __webpack_require__(65),
	        controller: function ($scope, $element, $timeout) {
	            console.log("init fileInput @ %o", $element);
	            $scope.namespaces = [];
	            $scope.get$inputs = function () {
	                return $element.find("input[type='file']");
	            };
	            $scope.$inputs = $scope.get$inputs();

	            $scope.clear = function () {
	                $scope.namespaces = [];
	            };

	            /**
	             * @param {Object} [options]
	             * @param {Boolean} [options.inputLimit=1]
	             */
	            $scope.upload = function (options) {
	                var opts = _.defaults(options, {
	                    inputLimit: $scope.inputLimit || 1
	                });
	                var $lastInput = $scope.$inputs.last();

	                if ($lastInput.length > 0) {
	                    if ($lastInput.val() && $lastInput.length >= opts.inputLimit) {
	                        // create a new dom input element
	                        $scope.namespaces.push(opts.namespace || 'uploads-' + $scope.namespaces.length);
	                    } else {
	                        // don't create anything new and use last input dom element as is
	                    }
	                } else {
	                    // skip checks and create a new dom input element
	                    $scope.namespaces.push(opts.namespace || 'uploads-' + $scope.namespaces.length);
	                }

	                $timeout(function () {
	                    $scope.reloadFileInputs();
	                    $scope.$inputs.last().click();
	                })
	            };

	            $scope.removeUploadByIndex = function (uploadIdx) {
	                $scope.namespaces.splice(uploadIdx, 1);
	                $scope.onFileInputChange({action: 'remove', idx: uploadIdx});
	            };

	            $scope.onFileInputChange = function (evt) {
	                $scope.$emit('file-input:change', $scope);
	                $scope.onFileInputChangeCallback()(evt, $scope.get$inputs(), $scope);
	            };

	            $scope.addFileInputListeners = function () {
	                $scope.$inputs = $scope.get$inputs();
	                $scope.$inputs.on('change', $scope.onFileInputChange);
	            };

	            $scope.removeFileInputListeners = function () {
	                $scope.$inputs.off('change', null, $scope.onFileInputChange);
	            };

	            $scope.reloadFileInputs = function () {
	                $scope.removeFileInputListeners();
	                $scope.addFileInputListeners();
	            };

	            $scope.onDestroy = function () {
	                $scope.removeFileInputListeners();
	            };

	            (function init() {
	                if ($scope.registerMediaScope) $scope.registerMediaScope($scope);
	            })();
	        },
	        link: function (scope, element, attributes) {
	            // When the destroy event is triggered, check to see if the above
	            // data is still available.
	            if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
	        }
	    }
	})


/***/ }),
/* 65 */
/***/ (function(module, exports) {

	module.exports = "<form class=\"file-input__form\" method=\"post\"><div class=\"file-input__inputs\"><input class=\"file-input__input\" type=\"file\" id=\"{{namespace}}\" name=\"{{namespace}}\" ng-repeat=\"namespace in namespaces\"></div><ng-transclude class=\"content\"></ng-transclude></form>"

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),
	    ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('autocompleteInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(67)
	    };
	});


/***/ }),
/* 67 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"input input--text {{isDefaultAllowed(propData) ? '' : 'input--no-default'}}\"><div class=\"input__input\"><md-autocomplete class=\"input-options\" md-search-text=\"propData.val\" md-search-text-change=\"setAnimalProperty(propData.key, propData)\" md-selected-item-change=\"setAnimalProperty(propData.key, propData)\" md-items=\"option in propData.options | filter:propData.val\" placeholder=\"propData.example\" md-min-length=\"1\" md-delay=\"250\" md-floating-label=\"{{propData.fieldLabel}}\"><md-item-template><span ng-bind=\"option\"></span></md-item-template><md-not-found><a ng-click=\"addSpeciesPropertyOption(propData.key, propData.val)\">Create option \"{{propData.val}}\"</a></md-not-found></md-autocomplete></div><div class=\"input__menu\" ng-if=\"isDefaultAllowed(propData)\"><md-menu><md-button class=\"md-icon-button\" ng-click=\"$mdOpenMenu($event)\"><md-icon class=\"material-icons\">more_vert</md-icon></md-button><md-menu-content><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"setAsDefault(propData)\">Set As Default</md-button></md-menu-item><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"resetFromDefault(propData)\">Reset To Default</md-button></md-menu-item></md-menu-content></md-menu></div></div>"

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),
	    ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('dateInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(69)
	    };
	});


/***/ }),
/* 69 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"input input--date {{isDefaultAllowed(propData) ? '' : 'input--no-default'}}\"><div class=\"input__input\"><label class=\"input__label\">{{propData.fieldLabel}}</label><md-datepicker ng-model=\"propData.val\" ng-change=\"setAnimalProperty(propData.key, propData)\"></md-datepicker></div><div class=\"input__menu\" ng-if=\"isDefaultAllowed(propData)\"><md-menu><md-button class=\"md-icon-button\" ng-click=\"$mdOpenMenu($event)\"><md-icon class=\"material-icons\">more_vert</md-icon></md-button><md-menu-content><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"setAsDefault(propData)\">Set As Default</md-button></md-menu-item><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"resetFromDefault(propData)\">Reset To Default</md-button></md-menu-item></md-menu-content></md-menu></div></div>"

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24);
	var angular = __webpack_require__(1);
	var ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('imagesInput', [function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(71),
	        controller: function ($scope, $element, $timeout) {
	            var watcherHandlers = {};

	            $scope.slider = {
	                options: {
	                    enabled: true,
	                    dots: true,
	                    infinite: false,
	                    adaptiveHeight: true,
	                    lazyLoad: 'ondemand'
	                },
	                state: {
	                    isReady: true
	                }
	            };

	            /**
	             *
	             * @param {Function} [callback]
	             */
	            $scope.initSlick = function (callback) {
	                console.trace('imagesInput.initSlick()');
	                $scope.slider.state.isReady = true;
	                if (callback) $timeout(callback);
	            };

	            /**
	             *
	             * @param {Function} [callback]
	             */
	            $scope.destroySlick = function (callback) {
	                $scope.slider.state.isReady = false;
	                if (callback) $timeout(callback);
	            };

	            /**
	             *
	             * @param {Function} [callback]
	             */
	            $scope.reloadSlick = function (callback) {
	                $scope.destroySlick(function () {
	                    $scope.initSlick(callback);
	                });
	            };

	            /**
	             *
	             * @param {String[]} imagesArr
	             * @param {Function} [callback]
	             */
	            $scope.setImages = function (imagesArr, callback) {
	                $scope.destroySlick(function () {
	                    /*
	                     var $slides = $element.find('.slide');
	                     $slides.remove();
	                     */
	                    $scope.propData.val = imagesArr;
	                    $scope.setAnimalProperty($scope.propData.key, {val: $scope.propData.val});
	                    $scope.initSlick(callback);
	                })
	            };

	            $scope.onDestroy = function () {
	                $scope.destroySlick();
	                _.forEach(watcherHandlers, function (handlerCallback) {
	                    handlerCallback();
	                })
	            };

	            $scope.removePhotoByIndex = function (imageIndex) {
	                var savedImages = _.reject($scope.propData.val, function (imageURL) {
	                    return imageURL.match(/^data/)
	                });

	                var savedImagesCount = savedImages.length;

	                if (imageIndex >= savedImagesCount) {
	                    // will trigger `onFileInputChange`, and consequently update the slider
	                    $scope.$media.removeUploadByIndex(imageIndex - savedImagesCount)
	                } else {
	                    $scope.setImages(_.reject($scope.propData.val, function (savedImageURL, index) {
	                        return index === imageIndex
	                    }));
	                }

	            };


	            /**
	             *
	             * @param imageURL
	             */
	            $scope.addPhoto = function (imageURL) {
	                $scope.setAnimalProperty($scope.propData.key, [imageURL].concat($scope.propData.val));
	            };


	            $scope.onFileMediaChange = function (evt, $inputs) {
	                // getUrls() is defined by jquery.file-input-urls.js
	                $inputs.getUrls()
	                    .then(function (fileUrls) {
	                        $scope.$apply(function () {
	                            var savedImages = _.reject($scope.propData.val, function (imageURL) {
	                                // remove all temporary previously uploaded images
	                                return imageURL.match(/^data/);
	                            });

	                            $scope.setImages(fileUrls.concat(savedImages));
	                        })
	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                    });
	            };


	            (function init() {
	                // watch for external changes
	                watcherHandlers.propData = $scope.$watch('petData.' + $scope.propData.key + '.val', function (newValue) {
	                    if (_.isArray(newValue)) {
	                        $scope.setImages(newValue);
	                    }
	                });
	            })()

	        },
	        link: function (scope, element, attributes) {
	            if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
	        }

	    }
	}]);


/***/ }),
/* 71 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"file-input\" on-file-input-change=\"onFileMediaChange\" trigger=\"uploadPhoto\"><div class=\"gallery__wrap\"><div class=\"images-nav\"><div class=\"md-button md-primary md-fab md-mini btn-add\" ng-click=\"uploadPhoto()\"><md-icon class=\"material-icons\">add</md-icon></div></div><slick settings=\"slider.options\" ng-if=\"slider.state.isReady\"><div class=\"slide\" ng-repeat=\"(idx, url) in propData.val track by idx\"><img class=\"slide__img\" ng-src=\"{{url}}\" alt=\"{{url}}\"><div class=\"md-button md-primary md-fab md-mini btn-remove\" ng-click=\"removePhotoByIndex(idx)\"><md-icon class=\"material-icons\">clear</md-icon></div></div></slick></div></div>"

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

	var ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('imagePlaceholder', function () {
	    return {
	        restrict: 'E',
	        controller: function ($scope, $element) {

	            $scope.$watch("src", function (val) {
	                if (val) $element.css({'background-image': 'url("' + val + '")'});
	            });

	        },
	        link: function (scope, element, attrs) {
	            console.log('imagePlaceholder.scope', scope);

	            attrs.$observe('imagePlaceholder', function (value) {
	                console.log('imagePlaceholder - setting background-image to: %s', value);
	                scope.src = value;
	            });
	            if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
	        }
	    }
	})


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

	var ngApp = __webpack_require__(8);
	module.exports = ngApp.directive('locationInput', [function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(74),
	        controller: function ($scope, $element, googleService, $timeout) {
	            console.log('map.$scope: %o', $scope);

	            $scope.askForLocation = function () {
	                if (navigator.geolocation) {
	                    navigator.geolocation.getCurrentPosition(function (position) {
	                        console.log('$scope.getLocation()');
	                        if (position.coords.latitude &&
	                            position.coords.longitude && !$scope['propData']['Lat'].val && !$scope['propData']['Lon'].val) {
	                            console.log('$scope.getLocation() @ %s,%s', position.coords.latitude, position.coords.longitude);
	                            $scope.$apply(function () {
	                                $scope.setLatLng(position.coords.latitude, position.coords.longitude)
	                            })
	                        }
	                    });
	                }
	            };

	            $scope.setLatLng = function (lat, lng) {
	                console.log('$scope.setLatLng(%s, %s)', lat, lng);
	                $scope['propData']['Lat'].val = parseFloat(lat);
	                $scope['propData']['Lon'].val = parseFloat(lng);
	                $scope.setAnimalProperty($scope['propData']['Lat'].key, $scope['propData']['Lat']);
	                $scope.setAnimalProperty($scope['propData']['Lon'].key, $scope['propData']['Lon']);
	            };

	            $scope.generateLocation = function () {
	                return {
	                    lat: parseFloat($scope['propData']['Lat'].val || $scope['propData']['Lat'].example || $scope['propData']['Lat'].defaultVal),
	                    lng: parseFloat($scope['propData']['Lon'].val || $scope['propData']['Lon'].example || $scope['propData']['Lon'].defaultVal)
	                }
	            };

	            $scope.onDestroy = function () {
	                console.log('$scope.onDestroy()');
	                google.maps.event.removeListener($scope.clickListener);
	                $scope.$watchMapHandler();
	                $scope.$watchDataHandler();
	            };

	            function initializeGoogleMaps() {
	                var map = new google.maps.Map($element.find('.google-maps')[0], $scope.map),
	                    loc = $scope.generateLocation(),
	                    marker = new google.maps.Marker({
	                        position: new google.maps.LatLng(loc.lat, loc.lng),
	                        map: map,
	                        title: 'Location'
	                    }),
	                    markerHTMLContent = "",
	                    infowindow = new google.maps.InfoWindow({
	                        content: markerHTMLContent
	                    });
	                console.log('initializing map to (%o, %o)', loc.lat, loc.lng);
	                $scope.markerObj = marker;
	                $scope.mapObj = map;

	                $scope.updateMapView = function () {
	                    var loc = $scope.generateLocation();
	                    var newCenter = new google.maps.LatLng(loc.lat, loc.lng);
	                    console.log('$scope.updateMapView(%o, %o)', loc.lat, loc.lng);
	                    $scope.markerObj.setPosition(newCenter);
	                    $scope.mapObj.panTo(newCenter);
	                };

	                $scope.$watchMapHandler = $scope.$watchGroup(['propData.Lat.val', 'propData.Lon.val'], function (newValue, oldValue) {
	                    console.log('map[%s] changed: %o', $scope.id, arguments);
	                    if (newValue[0] && newValue[1]) $scope.updateMapView();
	                });

	                $scope.$watchDataHandler = $scope.$watchGroup([
	                    'petData.' + $scope['propData']['Lat'].key + '.val',
	                    'petData.' + $scope['propData']['Lon'].key + '.val'
	                ], function (newValue, oldValue) {
	                    console.log('map[%s] changed: %o', $scope.id, arguments);
	                    if (newValue[0] && newValue[1]) {
	                        $scope.setLatLng(newValue[0], newValue[1]);
	                        $scope.updateMapView();
	                    }
	                });


	                // $scope.onMarkerClick = function () {
	                //     infowindow.open(map, marker);
	                // };

	                // $scope.clickListener = google.maps.event.addListener(marker, 'click', $scope.onMarkerClick);
	                $scope.clickListener = google.maps.event.addListener(map, "dblclick", function (event) {
	                    console.log('dblclick triggered.');
	                    // display the lat/lng in your form's lat/lng fields
	                    $scope.$apply(function () {
	                        $scope.setLatLng(event.latLng.lat(), event.latLng.lng());
	                    });
	                });

	                $scope['propData']['Lat'].val = $scope['propData']['Lat'].val || loc.lat;
	                $scope['propData']['Lon'].val = $scope['propData']['Lon'].val || loc.lng;
	                $scope.askForLocation();
	            }

	            function init() {
	                console.log('$scope: %o | propData: %o', $scope, $scope['propData']);
	                $scope.id = '';
	                $scope.map = {
	                    mapTypeId: google.maps.MapTypeId.ROADMAP,
	                    zoom: $scope.zoom || 8,
	                    scrollwheel: false,
	                    zoomControl: true,
	                    mapTypeControl: true,
	                    disableDoubleClickZoom: true,
	                    streetViewControl: false
	                };
	                $timeout(function () {
	                    initializeGoogleMaps();
	                });
	            }

	            googleService.onGoogleReady(init);
	        },
	        link: function (scope, element, attributes) {
	            // When the destroy event is triggered, check to see if the above
	            // data is still available.
	            if (scope.onDestroy) scope.$on("$destroy", scope.onDestroy);
	        }
	    }
	}]);


/***/ }),
/* 74 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"input input--map\"><h4 class=\"input__label\">{{propData.fieldLabel}}</h4><div class=\"google-maps\"></div></div>"

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24);
	var ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('numberInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(76)
	    };
	});


/***/ }),
/* 76 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"input input--select {{isDefaultAllowed(propData) ? '' : 'input--no-default'}}\"><div class=\"input__input\"><md-input-container class=\"md-block\"><label>{{propData.fieldLabel}}</label><input ng-model=\"propData.val\" ng-change=\"setAnimalProperty(propData.key, propData)\" type=\"number\"></md-input-container></div><div class=\"input__menu\" ng-if=\"isDefaultAllowed(propData)\"><md-menu><md-button class=\"md-icon-button\" ng-click=\"$mdOpenMenu($event)\"><md-icon class=\"material-icons\">more_vert</md-icon></md-button><md-menu-content><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"setAsDefault(propData)\">Set As Default</md-button></md-menu-item><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"resetFromDefault(propData)\">Reset To Default</md-button></md-menu-item></md-menu-content></md-menu></div></div>"

/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24);
	var ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('selectInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(78),
	        controller: function ($scope, $element, speciesDataService) {

	            if ($scope['propData'].valType === 'Boolean' && $scope['propData'].options.length === 0) {
	                $scope['propData'].options = [true, false];
	                console.log("setting %s options w/ %o", $scope['propData'].key, $scope['propData']);
	            }

	            if ($scope['propData'].key === 'species') {
	                speciesDataService.getSpeciesList()
	                    .then(function (speciesList) {
	                        console.log("!setting species options w/ %o", speciesList);
	                        $scope['propData'].options = speciesList;
	                    })
	            }
	        }
	    };
	});


/***/ }),
/* 78 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"input input--select {{isDefaultAllowed(propData) ? '' : 'input--no-default'}}\"><div class=\"input__input\"><md-input-container class=\"md-block\"><label>{{propData.fieldLabel}}</label><md-select ng-model=\"propData.val\" ng-change=\"setAnimalProperty(propData.key, propData)\"><md-option ng-value=\"option\" ng-repeat=\"option in propData.options\">{{getSelectOptionLabel(option)}}</md-option></md-select></md-input-container></div><div class=\"input__menu\" ng-if=\"isDefaultAllowed(propData)\"><md-menu><md-button class=\"md-icon-button\" ng-click=\"$mdOpenMenu($event)\"><md-icon class=\"material-icons\">more_vert</md-icon></md-button><md-menu-content><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"setAsDefault(propData)\">Set As Default</md-button></md-menu-item><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"resetFromDefault(propData)\">Reset To Default</md-button></md-menu-item></md-menu-content></md-menu></div></div>"

/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

	var _ = __webpack_require__(24),
	    ngApp = __webpack_require__(8);

	module.exports = ngApp.directive('textareaInput', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(80)
	    };
	});


/***/ }),
/* 80 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"input input--text {{isDefaultAllowed(propData) ? '' : 'input--no-default'}}\"><div class=\"input__input\"><md-input-container class=\"md-block\"><label>{{propData.fieldLabel}}</label><textarea md-select-on-focus ng-model=\"propData.val\" max-rows=\"8\" ng-change=\"setAnimalProperty(propData.key, propData)\"></textarea></md-input-container></div><div class=\"input__menu\" ng-if=\"isDefaultAllowed(propData)\"><md-menu><md-button class=\"md-icon-button\" ng-click=\"$mdOpenMenu($event)\"><md-icon class=\"material-icons\">more_vert</md-icon></md-button><md-menu-content><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"setAsDefault(propData)\">Set As Default</md-button></md-menu-item><md-menu-item class=\"action action--set-default\"><md-button class=\"action__button\" ng-click=\"resetFromDefault(propData)\">Reset To Default</md-button></md-menu-item></md-menu-content></md-menu></div></div>"

/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var angular = __webpack_require__(1);
	var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	var Animal = __webpack_require__(35);
	var Species = __webpack_require__(37);

	console.log('loading petFormController');

	module.exports = ngApp.directive('petForm', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(82),
	        controller: function ($scope, $element, $mdDialog, $routeParams, $controller, speciesFactory, addressFinderService, animalDataService, speciesDataService, userService) {
	            console.log('init petForm.controller');
	            angular.extend(this, $controller('formController', {$scope: $scope}));

	            /**
	             *
	             * @type {Animal}
	             */
	            $scope.activeAnimal = null;

	            $scope.fab = {
	                isOpen: false
	            };

	            $scope.toggleFAB = function () {
	                $scope.fab.isOpen = !$scope.fab.isOpen;
	            };

	            /**
	             *
	             * @param {Animal} [animal]
	             */
	            $scope.render = function (animal) {
	                var activeAnimal = animal || $scope.activeAnimal;


	                if (!activeAnimal) {
	                    // no-op
	                    return Promise.resolve();
	                }

	                var propPriorities = _.reduce(userService.getUserAnimalPropertiesOrder(), function (collection, propOrderVal, propName) {
	                    // +4 to start after species
	                    switch (propName) {
	                        case 'petId':
	                        case 'images':
	                        case 'petName':
	                        case 'species':
	                            // avoid overwritting these override these values
	                            break;
	                        default:
	                            collection[propName] = propOrderVal + 4;
	                    }
	                    return collection;
	                }, {
	                    // default sort order
	                    petId: 0,
	                    images: 1,
	                    petName: 2,
	                    species: 3
	                });

	                console.log('rendering with priorities: %j', propPriorities);

	                $scope.formRenderData = _.chain(activeAnimal.getProps())
	                    .reduce(function (collection, prop) {
	                        if (prop.key.match(/Lat|Lon/)) {
	                            // ignore location properties for now
	                            return collection;
	                        }

	                        collection.push(prop);
	                        return collection;
	                    }, [])
	                    .sortBy(function (propData) {
	                        // default to prop order in not specified
	                        return propPriorities[propData.key] ? propPriorities[propData.key] : 9999;
	                    })
	                    .value();

	                console.log('rendering: %o', $scope.formRenderData);
	                return Promise.resolve($scope.formRenderData);
	            };

	            function buildShelterAddress() {
	                var shelterLocationProperties = ['shelterAddrLine1', 'shelterAddrLine2', 'shelterAddrCity', 'shelterAddrSt', 'shelterAddrZip'],
	                    shelterLocationValues = shelterLocationProperties.map(function (propName, index) {
	                        return $scope.activeAnimal.getValue(propName);
	                    });

	                return shelterLocationValues.join(' ');
	            }

	            /**
	             *
	             * @return {Promise}
	             */
	            $scope.syncShelterAddressMap = function () {
	                var shelterAddress = buildShelterAddress();

	                return addressFinderService.findCoordinates(shelterAddress)
	                    .then(function (result) {
	                        var confirmDialog = $mdDialog.confirm()
	                            .title('Would you like to use this shelter address?')
	                            .textContent(result['address'])
	                            .ariaLabel('Shelter Address')
	                            .ok('Yes')
	                            .cancel('No');

	                        console.log('shelterAddressChange() = %o', result);

	                        return $mdDialog.show(confirmDialog)
	                            .then(function onAccept() {
	                                console.log('shelterAddressChange() - shelterGeoLat <- %s | shelterGeoLon <- %s', result['lat'], result['lng']);
	                                $scope.activeAnimal.setValue('shelterGeoLat', result['lat']);
	                                $scope.activeAnimal.setValue('shelterGeoLon', result['lng']);
	                            })
	                            .catch(function onDecline() {
	                                console.log('cancelled');
	                            });
	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                    })
	            };

	            /**
	             *
	             * @param options
	             * @return {Promise}
	             */
	            $scope.promptSpeciesSelection = function (options) {
	                var _options = _.defaults(options, {});
	                var $parentScope = $scope;

	                return speciesDataService.getSpeciesList()
	                    .then(function (speciesList) {

	                        var dialogConfiguration = {
	                            controller: function ($scope, $mdDialog) {

	                                $scope.speciesList = speciesList;
	                                $scope.selectSpecies = function (selectedSpecies) {
	                                    $mdDialog.hide(selectedSpecies);
	                                };

	                                var speciesWatchHandler = $parentScope.$watch('getPetSpeciesName()', function (speciesName) {
	                                    if (speciesName) {
	                                        speciesWatchHandler();
	                                        $mdDialog.hide(speciesName);
	                                    }
	                                });

	                                $parentScope.killSpeciesPrompt = function(){
	                                    delete $parentScope.killSpeciesPrompt;
	                                    speciesWatchHandler();
	                                    $mdDialog.cancel();
	                                };

	                            },
	                            template: __webpack_require__(83),
	                            parent: angular.element('.pet--form'),
	                            clickOutsideToClose: false,
	                            escapeToClose: false
	                        };

	                        return $mdDialog.show(dialogConfiguration)
	                    })
	                    .catch(function cancel(err) {
	                        console.warn('new animal dialog species selection canceled with: %j', err);
	                        return Promise.resolve('dog');
	                    });
	            };


	            /**
	             *
	             * @param {String} propName
	             * @param {Object} propData
	             */
	            $scope.setAnimalProperty = function (propName, propData) {
	                propData.key = propData.key || propName;
	                $scope.activeAnimal.setProps([propData]);
	            };

	            /**
	             *
	             * @param fieldName
	             * @param val
	             * @return {Promise}
	             */
	            $scope.addSpeciesPropertyOption = function (fieldName, val) {
	                var speciesProp = $scope.activeAnimal.getProp(fieldName);

	                speciesProp.options = _.uniq([val].concat(speciesProp.options));
	                $scope.activeAnimal.setProps([speciesProp]);
	                console.log('updated %s prop: %o', fieldName, speciesProp);

	                return speciesDataService.saveSpecies($scope.activeAnimal)
	                    .then(function () {
	                        return $scope.reloadPetSpecies({useCache: true})
	                    })
	                    .then(function () {
	                        $scope.render();
	                        $scope.showMessage('Created option, "' + val + '", for "' + fieldName + '"');
	                    });
	            };


	            /**
	             *
	             * @param {String} petId
	             * @return {Promise}
	             */
	            $scope.loadPetById = function (petId) {

	                console.log('petForm.loadPetById(%s)', petId);
	                $scope.showLoading();

	                return animalDataService.fetchAnimalById(petId)
	                    .then(function (fetchedAnimal) {
	                        if (!fetchedAnimal.getSpeciesName()) {
	                            fetchedAnimal.setValue('species', $routeParams.speciesName);
	                        }
	                        $scope.activeAnimal = fetchedAnimal;
	                        $scope.hideLoading();
	                        $scope.showMessage('Successfully loaded pet');
	                    })
	                    .catch(function (err) {

	                        console.error(err);
	                        $scope.hideLoading();
	                        $scope.showError('Could not load pet');

	                        return Promise.reject(err);
	                    });
	            };

	            /**
	             *
	             * @param {Object} [options]
	             * @param {Boolean} [options.idOnly]
	             */
	            $scope.clearPetValues = function (options) {
	                var _options = _.defaults(options, {
	                    idOnly: false
	                });

	                if (_options.idOnly === true) {
	                    $scope.activeAnimal.setValue('petId', null);
	                } else {
	                    _.forEach($scope.activeAnimal.toObject(), function (propData, propName) {
	                        if (propName !== 'species') {
	                            $scope.activeAnimal.setValue(propName, null);
	                        }
	                    });
	                }
	            };

	            /**
	             * removes temporarily uploaded images
	             */
	            $scope.sanitizePetMediaValues = function () {
	                var sanitizedImages = _.filter($scope.activeAnimal.getValue('images'), function (imageURL) {
	                    // remove preview data urls
	                    return imageURL && !(/^data/.test(imageURL));
	                });
	                $scope.activeAnimal.setValue('images', sanitizedImages);
	            };

	            /**
	             *
	             * @param {Object} [options]
	             * @param {Boolean} [options.updatePetList=true]
	             * @param {Boolean} [options.syncShelterMap=true]
	             * @param {Boolean} [options.visibleNotification=false]
	             * @param {Boolean} [options.successRedirect=false]
	             * @return {Promise<Animal>}
	             */
	            $scope.savePet = function (options) {
	                var opts = _.defaults(options, {
	                    updatePetList: true,
	                    syncShelterMap: true,
	                    visibleNotification: false,
	                    successRedirect: false
	                });
	                var beforeSave = function () {
	                    if (opts.syncShelterMap) {
	                        return $scope.syncShelterAddressMap()
	                            .catch(function (err) {
	                                console.error(err);
	                            })
	                    }

	                    // no-op by default
	                    return Promise.resolve();
	                };


	                return beforeSave()
	                    .then(function () {
	                        // avoid polluting the form's data
	                        $scope.sanitizePetMediaValues();

	                        // append file inputs to animal as $media object for form save.
	                        // this will be used by the dataAnimalService to save new images
	                        $scope.activeAnimal.$media = {
	                            images: $element.find('input[type="file"]')
	                        };

	                        return animalDataService.saveAnimal($scope.activeAnimal)
	                    })
	                    .then(function (savedAnimal) {
	                        $scope.activeAnimal = savedAnimal;
	                        $scope.hideLoading();
	                        $scope.render();

	                        if (opts.visibleNotification) {
	                            $scope.showMessage('Successfully saved');
	                        }

	                        if (opts.updatePetList) {
	                            animalDataService.getAnimalsBySpecies($scope.activeAnimal.getSpeciesName())
	                        }

	                        if (opts.successRedirect){
	                            $scope.editPet($scope.activeAnimal);
	                        }

	                        return Promise.resolve($scope.activeAnimal);
	                    });
	            };

	            /*
	             * @param {Object} [options]
	             * @param {Boolean} [options.showNotification=true]
	             * @returns {Promise}
	             */
	            $scope.deletePet = function (options) {
	                var _options = _.defaults(options, {
	                    showNotifications: true
	                });

	                return animalDataService.deleteAnimal($scope.activeAnimal)
	                    .then(function () {
	                        $scope.clearPetValues();
	                        // non-blocking
	                        animalDataService.getAnimals()
	                            .then(function () {

	                                $scope.showAnimalSearch();
	                                if (_options.showNotification) {
	                                    $scope.showMessage('Updated pet list');
	                                }
	                            })
	                            .catch(function (err) {

	                                if (_options.showNotification) {
	                                    $scope.showError('Could not update pet list');
	                                }

	                                return Promise.reject(err);
	                            });
	                    });
	            };

	            /**
	             *
	             * @return {Promise}
	             */
	            $scope.reloadPet = function () {

	                return animalDataService.fetchAnimal($scope.activeAnimal)
	                    .then(function (animal) {
	                        $scope.activeAnimal = animal;
	                        return Promise.resolve($scope.activeAnimal);
	                    });
	            };

	            /**
	             *
	             * @param {Object} [options]
	             * @param {Boolean} [options.useCache]
	             * @returns {Promise}
	             */
	            $scope.reloadPetSpecies = function (options) {
	                var speciesName = $scope.activeAnimal ? $scope.activeAnimal.getSpeciesName() : null;

	                if (!speciesName) {
	                    return Promise.reject(new Error('petForm.reloadPetSpecies() - could not determine species'))
	                }

	                return speciesDataService.getSpecies(speciesName, options)
	                    .then(function (species) {
	                        $scope.activeSpecies = species;
	                        $scope.activeAnimal.setProps($scope.activeSpecies.getSpeciesProps());
	                        return Promise.resolve($scope.activeAnimal);
	                    })
	            };

	            /**
	             *
	             * @returns {String}
	             */
	            $scope.getPetSpeciesName = function () {
	                if (!$scope.activeAnimal) {
	                    return false;
	                }

	                return $scope.activeAnimal.getSpeciesName();
	            };


	            /**
	             *
	             * @param {Object} propData
	             * @return {boolean}
	             */
	            $scope.isDefaultAllowed = function (propData) {
	                return propData.key !== 'species';
	            };

	            /**
	             *
	             * @param {Object} propData
	             * @returns {Promise}
	             */
	            $scope.setAsDefault = function (propData, options) {
	                var opts = _.defaults(options, {
	                    showNotification: true
	                });

	                $scope.showLoading();
	                userService.setUserDefault(propData);

	                return userService.saveCurrentUser()
	                    .then(function () {
	                        $scope.hideLoading();

	                        if (opts.showNotification) {
	                            $scope.showMessage("Saved default for '" + propData.key + "'");
	                        }
	                    })
	                    .catch(function (err) {

	                        $scope.hideLoading();
	                        $scope.showError("Could not save default for '" + propData.key + "'");

	                        return Promise.reject(err);
	                    })
	            };

	            /**
	             *
	             * @param {String} propData
	             * @returns {Promise}
	             */
	            $scope.resetFromDefault = function (propData) {
	                var userDefault = userService.getUserDefault(propData.key);

	                if (userDefault) {
	                    $scope.activeAnimal.setValue(propData.key, userDefault.val);
	                } else {
	                    $scope.activeAnimal.setValue(propData.key, propData.defaultVal);
	                }

	                $scope.showMessage("Reset '" + propData.key + "'");
	                return $scope.render();
	            };

	            (function init() {
	                console.log('init form: %o', $routeParams);
	                $scope.menu = {
	                    isOpen: false,
	                    actions: [
	                        {
	                            onClick: function () {
	                                $scope.deletePet()
	                            },
	                            label: 'delete',
	                            icon: 'delete_forever'
	                        },
	                        {
	                            onClick: function () {
	                                $scope.clearPetValues()
	                            },
	                            label: 'clear',
	                            icon: 'clear'
	                        },
	                        {
	                            onClick: function () {
	                                $scope.savePet({visibleNotification: true, successRedirect: true})
	                            },
	                            label: 'save',
	                            icon: 'save'
	                        }
	                    ]
	                };
	                var animalSpeciesWatchHandler = $scope.$watch('getPetSpeciesName()', function (currentFormSpecies) {
	                    console.log('getPetSpeciesName() = %s', currentFormSpecies);
	                    Promise.resolve(currentFormSpecies)
	                        .then(function (currentFormSpecies) {

	                            // fetch pet by URL params if possible
	                            if ($routeParams.petId && !$scope.activeAnimal) {
	                                return $scope.loadPetById($routeParams.petId)
	                                    .then(function () {
	                                        return $scope.render();
	                                    })
	                                    .then(function(){
	                                        return $scope.activeAnimal.getSpeciesName();
	                                    });
	                            }

	                            if (!currentFormSpecies) {
	                                return $scope.promptSpeciesSelection()
	                            }

	                            return currentFormSpecies
	                        })
	                        .then(function (speciesName) {
	                            return speciesDataService.getSpecies(speciesName);
	                        })
	                        .then(function(species){
	                            $scope.activeSpecies = species;
	                            return speciesDataService.getSpeciesList()
	                        })
	                        .then(function (speciesList) {
	                            var speciesProp = $scope.activeSpecies.getProp('species');

	                            speciesProp.options = speciesList;
	                            $scope.activeSpecies.setProps([speciesProp]);

	                            if (!$scope.activeAnimal) {
	                                $scope.activeAnimal = new Animal($scope.activeSpecies);
	                            } else {
	                                $scope.activeAnimal.setProps($scope.activeSpecies.getSpeciesProps());
	                                $scope.activeAnimal.setValue('species', $scope.activeSpecies.getSpeciesName());
	                            }

	                            // $apply necessary to inform angular of data change
	                            $scope.$apply(function(){
	                                $scope.render();
	                            })
	                        });

	                    var formDestroyHandler = $scope.$on('$destroy', function () {
	                        animalSpeciesWatchHandler();
	                        formDestroyHandler();
	                        if ($scope.killSpeciesPrompt) $scope.killSpeciesPrompt();
	                    });
	                });

	            })();
	        }
	    }
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 82 */
/***/ (function(module, exports) {

	module.exports = "<!--.batch-edit-list(ng-if=\"isBatchMode()\")--><!--    .batch-edit-list__content--><!--        .pet-thumbnail(ng-repeat=\"pet in $parent.selectedPetsDataCollection\")--><!--            .pet-thumbnail__placeholder(ng-style!=\"background:url('{{pet.images.val[0]}}')\")--><div><div class=\"fields\"><div class=\"field field--{{propData.key}}\" ng-repeat=\"propData in formRenderData\"><div class=\"auto-input\"></div></div></div><md-fab-speed-dial class=\"md-scale md-fab-bottom-right\" md-open=\"menu.isOpen\" md-direction=\"up\"><md-fab-trigger><md-button class=\"md-fab md-primary\" aria-label=\"menu\"><md-icon class=\"material-icons\">menu</md-icon></md-button></md-fab-trigger><md-fab-actions><md-button class=\"md-fab md-raised md-mini\" ng-repeat=\"action in menu.actions\" ng-click=\"action.onClick()\"><md-tooltip md-direction=\"left\" md-visible=\"menu.isOpen\">{{action.label}}</md-tooltip><md-icon class=\"material-icons\">{{action.icon}}</md-icon></md-button></md-fab-actions></md-fab-speed-dial></div>"

/***/ }),
/* 83 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"md-dialog-container\" id=\"new-animal-dialog\"><md-dialog aria-label=\"New Animal Dialog\"><md-toolbar><div class=\"md-toolbar-tools\"><h2>Add New</h2></div></md-toolbar><md-dialog-content><md-list><md-list-item ng-repeat=\"species in speciesList\" ng-click=\"selectSpecies(species)\">{{species}}</md-list-item></md-list></md-dialog-content></md-dialog></div>"

/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	module.exports = ngApp.directive('petList', function () {
	    return {
	        restrict: 'C',
	        replace: true,
	        template: __webpack_require__(85),
	        controller: function ($scope, $mdDialog, animalDataService, speciesDataService) {
	            $scope.currentSpeciesIndex = 0;
	            $scope.animals = {};
	            $scope.selectedPets = {};
	            $scope.selectedSpecies = null;
	            $scope.batchSpeciesProp = null;

	            $scope.getActiveSpecies = function () {
	                var defaultSpecies = 'dog';
	                var speciesName = false;

	                _.forEach($scope.selectedPets, function (animal) {
	                    speciesName = animal.getSpeciesName();
	                    if (speciesName) {
	                        // if we have a species, exit early
	                        return false;
	                    }
	                });

	                // use selected tab species in pet list as fallback
	                if (!speciesName && $scope.selectedSpecies) {
	                    speciesName = $scope.selectedSpecies;
	                }

	                return (speciesName || defaultSpecies).toLowerCase();
	            };

	            $scope.isBatchEditActive = function () {
	                return (_.keys($scope.selectedPets).length > 0);
	            };

	            /**
	             *
	             * @param {Animal} animal
	             */
	            $scope.selectPet = function (animal) {
	                $scope.selectedPets[animal.getId()] = animal;
	            };

	            /**
	             *
	             * @param {Animal} animal
	             */
	            $scope.deselectPet = function (animal) {
	                delete $scope.selectedPets[animal.getId()];
	            };

	            /**
	             *
	             * @param {Animal} animal
	             */
	            $scope.togglePetSelection = function (animal) {
	                var animalId = animal.getId();

	                $scope.selectedPets[animalId] ? $scope.deselectPet(animal) : $scope.selectPet(animal);
	            };

	            $scope.clearSelectedPets = function () {
	                _.forEach($scope.selectedPets, function (animal) {
	                    $scope.deselectPet(animal);
	                });
	            };

	            $scope.isEditableByBatch = function (propData) {
	                switch (propData.key) {
	                    case 'petName':
	                        return false;
	                    default:
	                        break;
	                }
	                switch (propData.valType) {
	                    case 'String':
	                    case 'Number':
	                    case 'Boolean':
	                    case 'Date':
	                        return true;
	                    default:
	                        return false;
	                }
	            };

	            $scope.setBatchSpecies = function (speciesName) {
	                $scope.showLoading();
	                return speciesDataService.getSpecies(speciesName, {useCache: true})
	                    .then(function (species) {
	                        $scope.batchProperties = species.getProps().filter($scope.isEditableByBatch);
	                        $scope.batchSpeciesProp = _.chain($scope.batchProperties)
	                            .find({key: 'species'})
	                            .extend({
	                                val: speciesName,
	                                options: $scope.speciesList
	                            })
	                            .value();
	                    })
	                    .catch(function (err) {
	                        $scope.showError('Could not get model for ' + speciesName);

	                        console.error(err);
	                    })
	                    .then(function () {
	                        $scope.hideLoading();
	                    })
	            };

	            $scope.batchEdit = function (ev) {
	                var speciesWatchHandler = $scope.$watch('batchSpeciesProp.val', function (activeSpeciesName) {
	                    if (!activeSpeciesName) {
	                        // ignore invalid speciesName value
	                        return;
	                    }
	                    $scope.setBatchSpecies(activeSpeciesName);
	                });

	                $scope.setBatchSpecies($scope.getActiveSpecies());

	                $mdDialog.show({
	                        controller: function ($mdDialog) {
	                            $scope.close = function () {
	                                console.log('petList: mdDialog: closing dialog');
	                                $mdDialog.hide();
	                            }
	                        },
	                        template: __webpack_require__(86),
	                        parent: angular.element(document.body),
	                        targetEvent: ev,
	                        scope: $scope,
	                        preserveScope: true,
	                        clickOutsideToClose: true
	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                    })
	                    .then(function () {
	                        speciesWatchHandler();
	                    })
	            };

	            $scope.isEditableProp = function (propData) {
	                switch (propData.key) {
	                    case 'petName':
	                        return false;
	                    default:
	                        break;
	                }
	                switch (propData.valType) {
	                    case 'String':
	                    case 'Number':
	                    case 'Boolean':
	                    case 'Date':
	                        return true;
	                    default:
	                        return false;
	                }
	            };


	            function loadPets() {
	                return speciesDataService.getSpeciesList()
	                    .then(function (speciesList) {
	                        $scope.speciesList = speciesList;
	                        return Promise.all(speciesList.map(function (speciesName) {
	                            return animalDataService.getAnimalsBySpecies(speciesName)
	                                .then(function (animals) {
	                                    $scope.animals[speciesName] = animals;
	                                })
	                        }))
	                    })
	            }

	            /**
	             *
	             * @param {Object} [options]
	             * @param {String} [options.showNotification=true]
	             */
	            $scope.save = function (options) {
	                var opts = _.defaults(options, {
	                    showNotification: true
	                });

	                $scope.showLoading();
	                return Promise.all(Object.keys($scope.selectedPets).map(function (animalId, idx) {
	                        var animal = $scope.selectedPets[animalId];

	                        if (!animal) {
	                            console.error('Could not save pet[%s]: %o', idx, animal);
	                            return Promise.resolve();
	                        }

	                        return animalDataService.fetchAnimal(animal)
	                            .then(function (fetchedAnimal) {

	                                fetchedAnimal.setProps($scope.batchProperties);

	                                return animalDataService.saveAnimal(fetchedAnimal)
	                                    .then(function (result) {
	                                        console.log('petList: saved pet (%s/%s)', idx, Object.keys($scope.selectedPets).length);
	                                        return result;
	                                    })
	                            })
	                            .catch(function (err) {
	                                if (opts.showNotification) $scope.showError('Could not save pet');
	                                console.error(err);
	                            })
	                    }))
	                    .then(function () {
	                        if (opts.showNotification) $scope.showMessage('All pets saved');
	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                        if (opts.showNotification) $scope.showError('Failed to save all pets');
	                    })
	                    .then(function () {
	                        $scope.hideLoading();
	                        loadPets();
	                    })
	            };


	            $scope.delete = function (options) {
	                $scope.showLoading();
	                return Promise.all(Object.keys($scope.selectedPets).map(function (selectedPetId) {
	                        return animalDataService.deleteAnimal($scope.selectedPets[selectedPetId])
	                    }))
	                    .then(function () {
	                        if ($scope.showNotification) $scope.showMessage('All pets deleted');
	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                        if ($scope.showNotification) $scope.showError('Could not delete all pets');
	                    })
	                    .then(function () {
	                        $scope.hideLoading();
	                        loadPets()
	                    })
	            };

	            (function init() {
	                loadPets();
	            })();
	        }
	    }
	});

	module.exports = ngApp;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 85 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"list\" layout-fill layout=\"column\"><md-content><md-tabs md-selected=\"currentSpeciesIndex\" md-dynamic-height md-border-bottom md-autoselect md-stretch-tabs=\"auto\"><md-tab ng-repeat=\"speciesName in speciesList\" label=\"{{speciesName}} ({{animals[speciesName].length}})\"><md-grid-list md-row-height=\"1:1\" md-cols-xs=\"2\" md-cols-sm=\"3\" md-cols-md=\"4\" md-cols-lg=\"8\" md-cols-gt-lg=\"12\"><md-grid-tile ng-repeat=\"pet in animals[speciesName]\" ng-style=\"{'background': 'url('+pet.getValue('images')[0]+') center, url(/images/placeholders/' + speciesName +'.png) center', 'background-size': 'cover' }\"><md-checkbox class=\"checkbox\" ng-checked=\"selectedPets[pet.getId()]\" ng-click=\"togglePetSelection(pet)\" aria-label=\"selected?\"></md-checkbox><md-grid-tile-footer class=\"tile-footer\" ng-click=\"editPet(pet);\"><h3>{{pet.getName() || pet.getId() || 'n/a'}}</h3></md-grid-tile-footer></md-grid-tile></md-grid-list></md-tab></md-tabs></md-content><md-fab-speed-dial class=\"md-fab-bottom-right md-scale pet-list-menu\" ng-show=\"isBatchEditActive()\" md-direction=\"up\" md-open=\"isPetListMenuOpen\" ng-click=\"isPetListMenuOpen!=isPetListMenuOpen\"><md-fab-trigger><md-button class=\"md-fab\"><md-icon class=\"material-icons\">menu</md-icon></md-button></md-fab-trigger><md-fab-actions><md-button class=\"md-fab md-mini md-raised\" ng-click=\"batchEdit($event)\"><md-icon class=\"material-icons\">edit</md-icon></md-button></md-fab-actions></md-fab-speed-dial></div>"

/***/ }),
/* 86 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"md-dialog-container\" id=\"batch-edit-dialog\"><md-dialog aria-label=\"Batch Edit dialog\"><md-toolbar><div class=\"md-toolbar-tools\"><h2>Batch Edit</h2><span flex></span><md-button class=\"md-icon-button\" ng-click=\"close()\"><md-icon class=\"material-icons\">close</md-icon></md-button></div></md-toolbar><md-dialog-content layout-padding><div class=\"batch-form\" ng-if=\"isBatchEditActive()\" ng-controller=\"formController\"><div class=\"fields\"><div class=\"field field--{{propData.key}}\" ng-repeat=\"propData in batchProperties\"><div class=\"auto-input\"></div></div></div><div class=\"nav\"><md-input-container><md-button class=\"btn-submit md-primary md-raised\" ng-click=\"save()\">Save</md-button><md-button class=\"btn-remove md-warn md-raised\" ng-click=\"delete() &amp;&amp; close()\">Delete</md-button></md-input-container></div></div></md-dialog-content></md-dialog></div>"

/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var angular = __webpack_require__(1);
	var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	var Species = __webpack_require__(37);

	console.log('loading speciesForm');

	module.exports = ngApp.directive('speciesForm', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(88),
	        controller: function ($scope, $routeParams, $location, $mdDialog, $controller, request, speciesDataService, userService) {
	            angular.extend(this, $controller('formController', {$scope: $scope}));
	            $scope.valTypes = ['String', 'Date', 'Number', 'Boolean'];
	            $scope.speciesName = $routeParams.speciesName;
	            $scope.speciesProps = [];
	            $scope.actionMenu.actions = [
	                {
	                    onClick: function () {
	                        speciesDataService.deleteSpecies($scope.speciesName)
	                            .then(function () {
	                                $location.path('/species');
	                            })
	                    },
	                    icon: 'delete_forever',
	                    label: 'Delete'
	                },
	                {
	                    onClick: function () {
	                        $scope.uploadPhoto();
	                    },
	                    icon: 'photo',
	                    label: 'Placeholder'
	                }
	            ];


	            /**
	             *
	             * @return {Promise}
	             */
	            $scope.onDragDrop = function () {
	                console.log('dragdrog: %o', arguments);

	                _.forEach($scope.speciesProps, function (propData, index) {
	                    userService.setUserAnimalPropertyOrder(propData.key, index);
	                });

	                return userService.saveCurrentUser()
	                    .then(function () {
	                        return $scope.showMessage('Saved order');
	                    })
	            };

	            $scope.onFileMediaChange = function (evt, $inputs) {
	                $scope.saveSpeciesPlaceholder($scope.speciesName, $inputs[0]);
	            };

	            /**
	             *
	             * @param {String} speciesName
	             * @param {HTMLElement} fileInput
	             * @param {Object} [options]
	             * @return {Promise}
	             */
	            $scope.saveSpeciesPlaceholder = function (speciesName, fileInput, options) {
	                var opts = _.defaults(options, {});

	                $scope.showLoading();
	                return speciesDataService.saveSpeciesPlaceholder($scope.speciesName, fileInput, opts)
	                    .then(function (result) {
	                        $scope.hideLoading();
	                        $scope.showMessage("Saved placeholder");
	                        return Promise.resolve(result);
	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                        $scope.hideLoading();
	                        $scope.showError('Could not save placeholder image');
	                        return Promise.reject(err);
	                    })
	            };

	            /**
	             *
	             * @param {Object} propData
	             * @return {Promise}
	             */
	            $scope.deleteProp = function (propData) {
	                console.log('deleting %s', propData.key);
	                var confirmationDialog = $mdDialog.confirm()
	                    .title("Delete Confirmation")
	                    .textContent("Delete '" + propData.key + "'?")
	                    .ok('Yes')
	                    .cancel('No');

	                return $mdDialog.show(confirmationDialog)
	                    .then(function onConfirm() {
	                        return speciesDataService.deleteSpeciesProp($scope.speciesName, propData.key)
	                    })
	                    .catch(function onCancel(err) {
	                        console.log('cancelled');
	                    })
	                    .then(function () {
	                        return $scope.showMessage("Deleted '" + propData.key + "'")
	                    })
	                    .then(function () {
	                        $location.path('/species/' + $scope.speciesName);
	                        return Promise.resolve();
	                    })
	            };

	            /**
	             *
	             * @param evt
	             * @return {Promise}
	             */
	            $scope.createNewProp = function (evt) {
	                var newPropDialogConfig = {
	                    template: __webpack_require__(89),
	                    targetEvent: evt,
	                    clickOutsideToClose: true,
	                    controller: ['$scope', '$mdDialog', function ($scope, $mdDialog) {
	                        console.log('init $mdDialog w/ $scope', $scope);
	                        $scope.save = function () {
	                            $mdDialog.hide(_.camelCase($scope.propName));
	                        };

	                        $scope.hide = function () {
	                            $mdDialog.cancel();
	                        }
	                    }]
	                };
	                var propName;

	                return $mdDialog.show(newPropDialogConfig)
	                    .catch(function onCancel(err) {
	                        console.log('cancelled: %o', arguments);
	                    })
	                    .then(function onConfirm(newPropName) {
	                        propName = newPropName;
	                        console.log('confirmed: %o', arguments);
	                        return speciesDataService.createSpeciesProp($scope.speciesName, propName);
	                    })
	                    .then(function () {
	                        $location.path('/species/' + $scope.speciesName + '/property/' + propName);
	                        return Promise.resolve();
	                    });

	            };


	            $scope.isEditableProp = function (propData) {
	                var unchangeables = {
	                    keys: [],
	                    valTypes: []
	                };

	                if (_.includes(unchangeables.keys, propData.key) || _.includes(unchangeables.valTypes, propData.valType)) {
	                    return false;
	                }

	                return true;
	            };

	            $scope.isVisibleProp = function (propData) {
	                var invisibles = {
	                    keys: [
	                        'petId',
	                        'species'
	                    ],
	                    valTypes: [
	                        '[Image]',
	                        'Location'
	                    ]
	                };

	                if (_.includes(invisibles.keys, propData.key) || _.includes(invisibles.valTypes, propData.valType)) {
	                    return false;
	                }

	                return true;
	            };

	            (function init() {
	                speciesDataService.getSpecies($scope.speciesName, {useCache: true})
	                    .then(function (species) {
	                        var activeSpecies = species;
	                        var defaultPropPriorities = {
	                            // default sort order
	                            petId: 0,
	                            images: 1,
	                            petName: 2,
	                            species: 3
	                        };
	                        var propPriorities = _.reduce(userService.getUserAnimalPropertiesOrder(), function (collection, propOrderVal, propName) {
	                            switch (propName) {
	                                case 'petId':
	                                case 'images':
	                                case 'petName':
	                                case 'species':
	                                    // avoid overwriting these these values because we always want them at the top
	                                    break;
	                                default:
	                                    // +4 to start after species
	                                    collection[propName] = propOrderVal + 4;
	                            }
	                            return collection;
	                        }, defaultPropPriorities);

	                        $scope.speciesProps = _.sortBy(activeSpecies.getProps(), function (propData) {
	                            // default to prop order in not specified
	                            return propPriorities[propData.key] ? propPriorities[propData.key] : 9999;
	                        });

	                    })
	                    .catch(function (err) {
	                        console.error(err);
	                        $scope.showError("Could not load '" + $scope.speciesName + "'")
	                    })
	            })()

	        }
	    }
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 88 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"view view--species\" layout=\"column\"><div class=\"file-input\" on-file-input-change=\"onFileMediaChange\" trigger=\"uploadPhoto\"><md-content><md-subheader class=\"md-primary\">{{speciesName}}</md-subheader><md-divider></md-divider><div flex><md-card md-3-line ng-if=\"isVisibleProp(speciesProp)\" ng-repeat=\"speciesProp in speciesProps\" data-drop=\"true\" data-drag=\"true\" ng-model=\"speciesProps\" jqyoui-droppable=\"{index: {{$index}}, onDrop: 'onDragDrop'}\" jqyoui-draggable=\"{index: {{$index}}, animate:true, insertInline: true}\" data-jqyoui-options=\"{revert: 'invalid', handle: 'md-card-title .md-headline'}\"><md-card-title><md-card-title-text><span class=\"md-headline\">{{speciesProp.fieldLabel}}</span><span class=\"md-subhead\">{{speciesProp.key}}</span></md-card-title-text></md-card-title><md-card-content layout=\"column\"><p>{{speciesProp.description}}</p></md-card-content><md-card-actions layout=\"row\" layout-align=\"end\"><md-button class=\"md-icon-button\" ng-click=\"editProp(speciesName, speciesProp)\" ng-if=\"isEditableProp(speciesProp)\"><md-icon class=\"material-icons\">mode_edit</md-icon></md-button><md-button class=\"md-icon-button\" ng-click=\"deleteSpeciesProp(speciesProp)\"><md-icon class=\"material-icons\">delete_forever</md-icon></md-button></md-card-actions></md-card></div></md-content></div><md-button class=\"button button--create-prop md-fab md-primary md-fab-bottom-right\" aria-label=\"Add species\" ng-click=\"createNewProp($event)\"><md-icon class=\"material-icons\">add</md-icon></md-button></div>"

/***/ }),
/* 89 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"md-dialog-container\" id=\"new-species-prop-dialog\"><md-dialog aria-label=\"New Species Property Dialog\"><md-toolbar><div class=\"md-toolbar-tools\"><h2>Add New Property</h2></div></md-toolbar><md-dialog-content><div class=\"md-dialog-content\"><md-input-container><label>Name</label><input ng-model=\"propName\"></md-input-container></div><div class=\"actions\"><md-button ng-click=\"hide()\">Cancel</md-button><md-button ng-click=\"save($event)\">Create</md-button></div></md-dialog-content></md-dialog></div>"

/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var angular = __webpack_require__(1);
	var ngApp = __webpack_require__(8);
	var moment = __webpack_require__(91);
	var _ = __webpack_require__(24);

	ngApp.directive('speciesPropForm', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(208),
	        controller: function ($scope, $routeParams, $location, $mdDialog, $controller, speciesDataService, userService) {
	            angular.extend(this, $controller('formController', {$scope: $scope}));

	            $scope.speciesName = $routeParams.speciesName;
	            $scope.propName = $routeParams.propName;
	            $scope.propOrderValue = userService.getPropPriority($scope.propName);

	            $scope.addSpeciesPropertyOption = function (key, option) {
	                $scope.propData.options = _.uniq([option].concat($scope.propData.options));
	            };

	            $scope.isFormValid = function () {
	                return angular.element('.section--edit-propData .md-input-invalid').length === 0;
	            };

	            $scope.hasEditableOptions = function () {
	                if (!$scope.propData) {
	                    console.warn('$scope.hasEditableOptions called without valid propData');
	                    return false;
	                }

	                switch ($scope.getPropType($scope.propData)) {
	                    case 'string':
	                    case 'number':
	                        return true;
	                    default:
	                        return false;
	                }
	            };

	            /**
	             *
	             * @returns {Promise}
	             */
	            $scope.saveSpeciesProperty = function () {

	                if (!$scope.isFormValid()) {
	                    var formErrMessage = "Form is invalid. Please fix.";

	                    $scope.showError(formErrMessage);

	                    return Promise.reject(new Error(formErrMessage));
	                }

	                if ($scope.propOrderValue) {
	                    userService.saveUserAnimalPropertyOrder($scope.propData.key, $scope.propOrderValue);
	                }

	                if ($scope.propData.val) {
	                    $scope.propData.defaultVal = angular.copy($scope.propData.val);
	                }

	                $scope.formatDefaultVal();

	                switch ($scope.propData.valType) {
	                    case 'Date':
	                    case 'Number':
	                        $scope.propData.options = [];
	                        break;
	                    case 'Boolean':
	                        $scope.propData.options = [true, false];
	                        break;
	                    default:
	                        break;
	                }

	                $scope.showLoading();
	                return speciesDataService.saveSpeciesProp($scope.speciesName, _.omit($scope.propData, 'val'))
	                    .then(function(){
	                        $scope.hideLoading();
	                        $scope.showMessage("Successfully saved property");
	                    })
	                    .catch(function (err) {
	                        $scope.hideLoading();
	                        $scope.showError("Failed to save property");
	                        console.error(err);
	                        return Promise.reject(err);
	                    })
	            };

	            /**
	             *
	             * @returns {Promise}
	             */
	            $scope.deleteSpeciesProperty = function () {
	                return speciesDataService.deleteSpeciesProp($scope.speciesName, $scope.propName);
	            };


	            /**
	             *
	             * @param {String} [defaultValType]
	             */
	            $scope.formatDefaultVal = function (defaultValType) {
	                var propType = defaultValType || $scope.propData.valType;
	                console.log('setting prop type to %s', propType);
	                switch (propType) {
	                    case 'Date':
	                        $scope.propData.defaultVal = moment.utc($scope.propData.defaultVal).toDate();
	                        break;
	                    case 'Number':
	                        if (!_.isNumber($scope.propData.defaultVal)) {
	                            $scope.propData.defaultVal = parseFloat($scope.propData.defaultVal) || 0;
	                        }
	                        break;
	                    case 'Boolean':
	                        if (!_.isBoolean($scope.propData.defaultVal)) {
	                            $scope.propData.defaultVal = true;
	                        }
	                        break;
	                    case 'String':
	                    default:
	                        if (!_.isString($scope.propData.defaultVal)) {
	                            $scope.propData.defaultVal = '';
	                        }
	                }
	            };

	            (function init() {
	                var propTypeWatchHandler;
	                var destroyWatchHandler;

	                speciesDataService.getSpecies($scope.speciesName)
	                    .then(function(species){
	                        $scope.activeSpecies = species;
	                        $scope.propData = speciesDataService.getSpeciesProp($scope.speciesName, $scope.propName);
	                        $scope.valTypes = _.reduce($scope.activeSpecies.getSpeciesProps(), function(valTypes, speciesProp){
	                            if (valTypes.indexOf(speciesProp.valType) < 0){
	                                valTypes.push(speciesProp.valType);
	                            }
	                            return valTypes;
	                        }, ['Number', 'String', 'Date', 'Boolean']);

	                        if (!$scope.activeSpecies.getProp($scope.propName)) {
	                            $scope.showError("Property not valid");
	                            console.error('invalid propName');
	                            $location.path('/species/' + $scope.speciesName);
	                        }

	                        propTypeWatchHandler = $scope.$watch("propData.valType", function (valType) {
	                            $scope.formatDefaultVal(valType);
	                        });

	                        destroyWatchHandler = $scope.$on('$destroy', function () {
	                            propTypeWatchHandler();
	                            destroyWatchHandler();
	                        });
	                    });
	            })()
	        }
	    }
	});

	module.exports = ngApp;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */,
/* 104 */,
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */,
/* 111 */,
/* 112 */,
/* 113 */,
/* 114 */,
/* 115 */,
/* 116 */,
/* 117 */,
/* 118 */,
/* 119 */,
/* 120 */,
/* 121 */,
/* 122 */,
/* 123 */,
/* 124 */,
/* 125 */,
/* 126 */,
/* 127 */,
/* 128 */,
/* 129 */,
/* 130 */,
/* 131 */,
/* 132 */,
/* 133 */,
/* 134 */,
/* 135 */,
/* 136 */,
/* 137 */,
/* 138 */,
/* 139 */,
/* 140 */,
/* 141 */,
/* 142 */,
/* 143 */,
/* 144 */,
/* 145 */,
/* 146 */,
/* 147 */,
/* 148 */,
/* 149 */,
/* 150 */,
/* 151 */,
/* 152 */,
/* 153 */,
/* 154 */,
/* 155 */,
/* 156 */,
/* 157 */,
/* 158 */,
/* 159 */,
/* 160 */,
/* 161 */,
/* 162 */,
/* 163 */,
/* 164 */,
/* 165 */,
/* 166 */,
/* 167 */,
/* 168 */,
/* 169 */,
/* 170 */,
/* 171 */,
/* 172 */,
/* 173 */,
/* 174 */,
/* 175 */,
/* 176 */,
/* 177 */,
/* 178 */,
/* 179 */,
/* 180 */,
/* 181 */,
/* 182 */,
/* 183 */,
/* 184 */,
/* 185 */,
/* 186 */,
/* 187 */,
/* 188 */,
/* 189 */,
/* 190 */,
/* 191 */,
/* 192 */,
/* 193 */,
/* 194 */,
/* 195 */,
/* 196 */,
/* 197 */,
/* 198 */,
/* 199 */,
/* 200 */,
/* 201 */,
/* 202 */,
/* 203 */,
/* 204 */,
/* 205 */,
/* 206 */,
/* 207 */,
/* 208 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"section section--edit-propData\"><div class=\"section__content\"><md-card><md-card-title><md-card-title-text><span class=\"md-headline\">{{propData.key}}</span></md-card-title-text></md-card-title><md-card-content><div class=\"propData-field propData-field--fieldLabel\"><md-input-container><label>Field Label</label><textarea ng-model=\"propData.fieldLabel\" rows=\"1\" max-rows=\"8\" md-select-on-focus></textarea></md-input-container></div><div class=\"propData-field propData-field--valType\"><md-input-container><label>Type</label><md-select ng-model=\"propData.valType\"><md-option ng-repeat=\"type in valTypes\" ng-value=\"type\">{{type}}</md-option></md-select></md-input-container></div><div class=\"propData-field propData-field--defaultVal\"><div class=\"default-species-prop-input\"></div></div><md-chips ng-model=\"propData.options\" placeholder=\"Option\" ng-if=\"hasEditableOptions()\" md-removable md-enable-chip-edit=\"true\"></md-chips></md-card-content><md-card-actions layout=\"row\" layout-align=\"end\"><md-button class=\"md-icon-button\" ng-click=\"saveSpeciesProperty()\"><md-icon class=\"material-icons\">save</md-icon></md-button><md-button class=\"md-icon-button\" ng-click=\"deleteSpeciesProperty()\"><md-icon class=\"material-icons\">delete_forever</md-icon></md-button></md-card-actions></md-card></div></div>"

/***/ }),
/* 209 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Promise) {var ngApp = __webpack_require__(8);
	var _ = __webpack_require__(24);

	module.exports = ngApp.directive('speciesList', function () {
	    return {
	        restrict: 'C',
	        template: __webpack_require__(210),
	        controller: function ($scope, $mdDialog, $location, speciesDataService) {


	            $scope.createNewSpecies = function (evt) {
	                var newSpeciesDialogParams = {
	                    template: __webpack_require__(211),
	                    targetEvent: evt,
	                    clickOutsideToClose: true,
	                    controller: ['$scope', '$mdDialog', function ($scope, $mdDialog) {
	                        console.log('init $mdDialog w/ $scope', $scope);
	                        $scope.save = function () {
	                            $mdDialog.hide(_.kebabCase($scope.speciesName));
	                        };

	                        $scope.hide = function () {
	                            $mdDialog.cancel();
	                        }
	                    }]
	                };
	                var newSpeciesName;

	                return $mdDialog.show(newSpeciesDialogParams)
	                    .then(function onConfirm(speciesName) {
	                        console.log('confirmed: %o', arguments);
	                        newSpeciesName = speciesName;
	                        return speciesDataService.createSpecies(newSpeciesName);
	                    })
	                    .then(function () {
	                        $location.path('species/' + newSpeciesName);
	                        return Promise.resolve();
	                    })
	                    .catch(function onCancel(err) {
	                        console.log('cancelled: %o', arguments);
	                        return Promise.reject(err);
	                    });

	            };


	            speciesDataService.getSpeciesList()
	                .then(function(speciesList){
	                    $scope.speciesList = speciesList;
	                })
	                .catch(function(err){
	                    console.error(err);
	                });
	        }
	    }
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 210 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"view view--species-list\" layout=\"column\"><md-content><md-grid-list md-row-height=\"1:1\" md-cols-xs=\"2\" md-cols-sm=\"3\" md-cols-md=\"4\" md-cols-lg=\"8\" md-cols-gt-lg=\"12\"><md-grid-tile ng-repeat=\"species in speciesList\" ng-click=\"showSpecies(species)\" ng-style=\"{ 'background': 'url(&quot;/images/placeholders/'+species+'.png&quot;) center', 'background-size': 'cover'}\"><md-grid-tile-footer class=\"tile-footer\"><h3>{{species}}</h3></md-grid-tile-footer></md-grid-tile></md-grid-list></md-content><md-button class=\"md-fab md-primary md-fab-bottom-right\" aria-label=\"Add species\" ng-click=\"createNewSpecies($event)\"><md-icon class=\"material-icons\">add</md-icon></md-button></div>"

/***/ }),
/* 211 */
/***/ (function(module, exports) {

	module.exports = "<div class=\"md-dialog-container\" id=\"new-species-dialog\"><md-dialog aria-label=\"New Species Dialog\"><md-toolbar><div class=\"md-toolbar-tools\"><h2>Add New Species</h2></div></md-toolbar><md-dialog-content><div class=\"md-dialog-content\"><md-input-container><label>Species Name</label><input ng-model=\"speciesName\"></md-input-container></div><div class=\"actions\"><md-button ng-click=\"hide()\">Cancel</md-button><md-button ng-click=\"save($event)\">Create</md-button></div></md-dialog-content></md-dialog></div>"

/***/ })
]);