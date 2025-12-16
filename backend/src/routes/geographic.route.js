import { Router } from 'express';

import { 
    getMunicipalities, 
    getMunicipalityById ,
    getRegions,
    getProvinces,
    getProvincesbyRegionId
} from '../controllers/geographic.controller.js';


const router = Router();

// Matches: GET /api/municipalities
router
    .route("/municipalities")
    .get(getMunicipalities);

// Matches: GET /api/v1/municipalities/:id
router
    .route("/municipalities/:id")
    .get(getMunicipalityById);

// Matches: GET /api/regions
router
    .route("/regions")
    .get(getRegions);

// Matches: GET /api/provinces
router
    .route("/provinces")
    .get(getProvinces);

// Matches: GET /api/provinces/:id
router
    .route("/provinces/:id")
    .get(getProvincesbyRegionId);

export default router;