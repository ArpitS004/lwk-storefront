import { Layout } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSubmitContactMessage } from "@/lib/api-client"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export default function Contact() {
  const submitMessage = useSubmitContactMessage()
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage.mutate(
      { data: formData },
      { onSuccess: () => setSuccess(true) }
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-24 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-32">
          
          <div>
            <h1 className="text-4xl md:text-6xl tracking-tighter uppercase mb-8">Contact</h1>
            <div className="space-y-12 text-sm uppercase tracking-widest">
              <div>
                <h2 className="text-muted-foreground mb-4 font-mono">Inquiries</h2>
                <p>info@lwk-atelier.com</p>
              </div>
              <div>
                <h2 className="text-muted-foreground mb-4 font-mono">Press & Wholesale</h2>
                <p>studio@lwk-atelier.com</p>
              </div>
              <div>
                <h2 className="text-muted-foreground mb-4 font-mono">Studio (Appointments Only)</h2>
                <p className="leading-relaxed">
                  182 Minimalist Ave<br/>
                  Los Angeles, CA 90021<br/>
                  United States
                </p>
              </div>
            </div>
          </div>

          <div>
            {success ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-border border-dashed">
                <h3 className="text-xl uppercase tracking-widest mb-4">Message Received</h3>
                <p className="text-muted-foreground">Our studio will be in touch shortly.</p>
                <Button variant="outline" className="mt-8" onClick={() => {setSuccess(false); setFormData({name:"", email:"", subject:"", message:""})}}>
                  Send Another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input 
                  placeholder="Full Name" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <Input 
                  type="email"
                  placeholder="Email Address" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="font-mono text-sm"
                />
                <Input 
                  placeholder="Subject" 
                  required
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
                <textarea 
                  placeholder="Message" 
                  required
                  rows={6}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-transparent border-b border-border p-3 text-sm focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
                />
                <Button type="submit" disabled={submitMessage.isPending} className="w-full">
                  {submitMessage.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Transmit"}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </Layout>
  )
}
