import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import axios from 'axios';
import { BACKEND_URL } from "~/lib/config";

const FormSchema = z.object({
    github: z.url().optional(),
    linkedin: z.string().optional()
})

type FormSchemaType = z.infer<typeof FormSchema>;

export default function Form (){

    const [form, setForm] = useState<FormSchemaType>({
        github: "",
        linkedin: ""
    })

    async function onSubmit (){
        const result = FormSchema.safeParse(form)
        if (!result.success){
            if (result.error.message.includes('linkedin') && result.error.message.includes("github")){
                toast.error('Invalid Link', {
                 className: "",
                 description: "Please enter valid GitHub & LinkedIn url",
                 duration: 3000
             })
             return
            }
            if (result.error.message.includes('github')){
                toast.error('Invalid GitHub Link', {
                 className: "",
                 description: "Please enter valid GitHub link",
                 duration: 3000
             })
             return
            }
            if (result.error.message.includes('linkedin')){
                toast.error('Invalid LinkedIn Link', {
                 className: "",
                 description: "Please enter valid LinkedIn link",
                 duration: 3000
             })
             return
            }
        }
        
        const res = await axios.post(`${BACKEND_URL}/pre-interview`, {
            form
        })
        console.log(res)
        if (!res.data.status){
            toast.error(res.data.message)
        }
    }

    return <div className="container h-screen mx-auto flex justify-center items-center">
            <div className="flex flex-col gap-5">
                <h1 className="scroll-m-20 text-center text-2xl font-extrabold tracking-tight text-balance">
                    AI Interviewer kickstart
                </h1>
                <div className="justify-center flex flex-col gap-2">
                    <Input onChange={(e) => setForm((prevData) => ({...prevData, github: e.target.value}))} value={form.github} placeholder="GitHub Link" className="min-w-md" />
                    <Input onChange={(e) => setForm((prevData) => ({...prevData, linkedin: e.target.value}))} value={form.linkedin} placeholder="LinkedIn Link" className="min-w-md" />
                    <Button className="w-fit self-center" onClick={onSubmit}>Send</Button>
                </div>
            </div>

        </div>
}