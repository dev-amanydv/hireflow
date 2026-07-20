import express from "express";
import { handleGoogle, handleMe, handleSignin, handleSignup } from "../controllers/auth.controller";
import { AsyncHandler } from "../utils/AsyncHandler";

const router = express.Router();

router.get('/me', AsyncHandler(handleMe));
router.post('/signup', AsyncHandler(handleSignup));
router.post('/signin', AsyncHandler(handleSignin));
router.post('/google', AsyncHandler(handleGoogle));

export default router;