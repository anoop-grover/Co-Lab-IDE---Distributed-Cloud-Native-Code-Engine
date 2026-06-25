import express from 'express';
import { createRoom, getRoomById,joinRoom } from '../controller/room';
import {authMiddleware} from '../middleware/authMiddleware'
const router = express.Router();

router.post("/",authMiddleware,createRoom);
<<<<<<< HEAD
router.get("/:roomId",authMiddleware,getRoomById);
router.post("/join",authMiddleware,joinRoom);

=======
router.get("/:roomId",getRoomById);
router.post("/join",authMiddleware,joinRoom);
router.patch("/",)
>>>>>>> 77dd6efc1501daac0e155aba29b032095756a3ac
export default router;