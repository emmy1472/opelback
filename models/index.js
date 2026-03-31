/**
 * Export all models in one place
 */
module.exports = {
    User: require('./User'),
    VehicleModel: require('./VehicleModel'),
    VehicleCatalog: require('./VehicleCatalog'),
    VehiclePart: require('./VehiclePart'),
    VehicleSpec: require('./VehicleSpec'),
    SearchHistory: require('./SearchHistory'),
    ScrapedPart: require('./ScrapedPart')
};
