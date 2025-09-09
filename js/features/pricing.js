// Pricing module
window.Pricing = (function(){
    const vehiclePricing = {
        bakkie: { base: 50, perKm: 15, name: 'Bakkie' },
        van: { base: 70, perKm: 18, name: 'Van' },
        truck: { base: 100, perKm: 22, name: 'Truck' }
    };

    function getVehicleConfig(vehicleKey) {
        return vehiclePricing[vehicleKey] || vehiclePricing.bakkie;
    }

    function calculate(vehicleKey, distanceKm) {
        const cfg = getVehicleConfig(vehicleKey);
        const base = cfg.base;
        const distance = Math.max(0, Math.round(distanceKm * cfg.perKm));
        return {
            name: cfg.name,
            base,
            distance,
            total: base + distance
        };
    }

    return { getVehicleConfig, calculate };
})();


