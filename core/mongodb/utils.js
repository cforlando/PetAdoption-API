var _ = require('lodash'),
    
    config = require('../config');

module.exports = {
    buildModelSchema : function(schema){
        var _animalModel = {},
            _schemaPropType,
            _isArray;
        if(config.debugLevel > config.DEBUG_LEVEL_LOW) console.log('building model from schema');
        _.forEach(schema, function (schemaPropVal, schemaPropName) {
            _schemaPropType = schemaPropVal.type;
            _isArray = false;
            if (!_schemaPropType) {
                console.log('skipping %s', schemaPropName);
                return; // ignore invalid props
            }
            if(_.isArray(_schemaPropType)) {
                _schemaPropType = _schemaPropType[0];
                _isArray = true;
            }
            switch (_schemaPropType) {
                case '[Image]':
                    _schemaPropType = [String];
                    break;
                case 'Number':
                case 'Location':
                    if (schemaPropName == 'petId' || schemaPropName == 'lostGeoLon' || schemaPropName == 'lostGeoLat') {
                        _schemaPropType = String
                    } else {
                        _schemaPropType = Number;
                    }
                    break;
                case 'Date':
                    _schemaPropType = Date;
                    break;
                case 'Boolean':
                    _schemaPropType = Boolean;
                    break;
                default:
                    _schemaPropType = String;
                    break;
            }
            _animalModel[schemaPropName] = {
                defaultVal: (_isArray) ? [_schemaPropType] : _schemaPropType,
                valType: String,
                name: String,
                key: String,
                fieldLabel: String,
                description: String,
                required: String,
                example: (_isArray) ? [_schemaPropType] : _schemaPropType,
                note: String,
                options: [_schemaPropType]
            };
        });
        _animalModel['timestamp'] = Number;
        return _animalModel;
    },
    escapeRegExp: function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
};
