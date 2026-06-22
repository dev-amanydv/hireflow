import express from "express";
import { handleGoogle, handleSignin, handleSignup } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.post('/signup', handleSignup);
router.post('/signin', handleSignin);
router.post('/google', handleGoogle);

export default router;