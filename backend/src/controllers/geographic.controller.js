import * as geographicService from '../services/geographic.service.js';

/**
 * @desc   Get all municipalities
 * @route  GET /api/mnicipalities
 * @access Public
 */
export const getMunicipalities = async (req, res) => {
    try {
        // Uncommented this line to actually get data
        const data = await geographicService.getMunicipalities();
        
        res.status(200).json({ 
            success: true, 
            data: data 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

/**
 * @desc   Get single municipality by ID
 * @route  GET /api/municipalities/:id
 * @access Public
 */
export const getMunicipalityById = async (req, res) => {
    try {
        const { id } = req.params;

        const data = await geographicService.getMunicipalityById(id);

        res.status(200).json({ 
            success: true, 
            data: data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

/**
 * @desc   Get all regions
 * @route  GET /api/regions
 * @access Public
 */
export const getRegions = async (req, res) => {
    try {
        const data = await geographicService.getRegions();

        res.status(200).json({ 
            success: true, 
            data: data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

/**
 * @desc   Get all regions
 * @route  GET /api/provinces
 * @access Public
 */
export const getProvinces = async (req, res) => {
    try {
        const data = await geographicService.getProvinces();

        res.status(200).json({ 
            success: true, 
            data: data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
};

/**
 * @desc   Get all regions
 * @route  GET /api/regions
 * @access Public
 */
export const getProvincesbyRegionId = async (req, res) => {
    try {
        const data = await geographicService.getRegions();

        res.status(200).json({ 
            success: true, 
            data: data
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
};