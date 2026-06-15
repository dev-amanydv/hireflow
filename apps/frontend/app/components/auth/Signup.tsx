import { GoogleLogin } from "@react-oauth/google";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CiLock, CiMail } from "react-icons/ci";
import { Link, replace, useNavigate } from "react-router";
import { useState, type Dispatch, type SetStateAction } from "react";
import z from "zod";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "~/lib/config";
import { useAuth } from "~/store/store";

const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(4)
})

type Signup = z.infer<typeof signupSchema>;

interface FieldError {
    email?: string[],
    password?: string[]
}

export default function SignupPage({ setPopup }: {
    setPopup: (value: "signin" | "signup" | "none") => void
}) {
    const [form, setForm] = useState<Signup>({
        email: '',
        password: ''
    });
    const [fieldErrors, setFieldErrors] = useState<FieldError>();
    const addUser = useAuth((state) => state.addUser);
    const navigate = useNavigate();

    async function onSubmit() {
        const result = signupSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setFieldErrors(fieldErrors)
        };

        const res = await axios.post(`${BACKEND_URL}/auth/signup`, {
            email: form.email,
            password: form.password
        });

        if (!res.data.success) {
            toast.error(res.data.message)
        };
        addUser({userId: res.data.data.id, email: res.data.data.email});
        navigate('/dashboard', { replace: true })
    }

    return (
        <div onClick={() => setPopup('none')} className="w-screen fixed h-screen flex justify-center items-center bg-black/20 backdrop-blur-[1px]">
            <div onClick={(e) => e.stopPropagation()} className="bg-white z-20 h-125 flex flex-col relative rounded-2xl overflow-hidden min-w-lg">
                <img src="/quick-hire-logo.png" className="m-1 absolute -top-3 left-0 rounded-md" width={150} alt="" />
                <div className="p-5 pt-33 flex flex-col z-20 gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-medium text-sm">Email Address</h1>
                        <div className="flex flex-col gap-1 relative">
                            <CiMail className="absolute text-neutral-500 left-2 top-2" />
                            <Input onClick={() => setFieldErrors({})} value={form.email} onChange={(e) => setForm(() => ({ ...form, email: e.target.value }))} className="px-8 placeholder:text-neutral-500" placeholder="ay.work07@gmail.com" />
                            <span className="text-red-600 text-sm">{fieldErrors?.email ? fieldErrors.email : null}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="font-medium text-sm">Password</h1>
                        <div className="flex flex-col relative gap-1">
                            <CiLock className="absolute text-neutral-500 left-2 top-2" />
                            <Input onClick={() => setFieldErrors({})} value={form.password} onChange={(e) => setForm(() => ({ ...form, password: e.target.value }))} type="string" className="px-8 placeholder:text-neutral-500" placeholder="1234" />
                            <span className="text-red-600 text-sm">{fieldErrors?.password ? 'Password must be atleast 4 characters long' : null}</span>
                        </div>
                    </div>
                    <Button onClick={onSubmit} className="text-white py-5 bg-[#3474F4] hover:bg-[#2d68de] cursor-pointer" >Register</Button>
                    <div className="flex items-center gap-2 text-neutral-500">
                        <hr className="w-full" />
                        or
                        <hr className="w-full" />
                    </div>
                    <div className="flex gap-4 flex-col w-full items-center">
                        <GoogleLogin size="large" theme="outline" width={300}
                            onSuccess={credentialResponse => {
                                console.log(credentialResponse);
                            }}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-neutral-500">Already have an account?</p>
                            <button onClick={() => setPopup('signin')} className="text-sm underline hover:text-blue-600 cursor-pointer">Login here!</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}