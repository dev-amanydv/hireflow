import { GoogleLogin } from "@react-oauth/google";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CiLock, CiMail } from "react-icons/ci";
import { Link } from "react-router";
import type { Dispatch, SetStateAction } from "react";

export default function SigninPage({setPopup} : {
    setPopup: (value: "signin" | "signup" | "none") => void
}) {

    return (
        <div onClick={() => setPopup('none')} className="w-screen fixed h-screen flex justify-center items-center bg-black/20 backdrop-blur-[1px]">
            <div onClick={(e) => e.stopPropagation()} className="bg-white z-20 h-125 flex flex-col relative rounded-2xl overflow-hidden min-w-lg">
                <img src="/quick-hire-logo.png" className="m-1 absolute -top-3 left-0 rounded-md" width={150} alt="" />
                <div className="p-5 pt-33 flex flex-col z-20 gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="font-medium text-sm">Email Address</h1>
                        <div className="flex items-cente relative">
                            <CiMail className="absolute text-neutral-500 left-2 top-2" />
                            <Input className="px-8 placeholder:text-neutral-500" placeholder="ay.work07@gmail.com" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="font-medium text-sm">Password</h1>
                        <div className="flex items-cente relative">
                            <CiLock className="absolute text-neutral-500 left-2 top-2" />
                            <Input type="number" className="px-8 placeholder:text-neutral-500" placeholder="1234" />
                        </div>
                    </div>
                    <Button className="text-white py-5 bg-[#3474F4] hover:bg-[#2d68de] cursor-pointer" >Login to dashboard</Button>
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
                            <p className="text-sm text-neutral-500">Don't have an account yet?</p>
                            <button onClick={() => setPopup('signup')} className="text-sm underline hover:text-blue-600 cursor-pointer">Create new here!</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}