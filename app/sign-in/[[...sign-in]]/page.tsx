import { SignIn } from '@clerk/nextjs'

const page = ()=>{
  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className='hero-content'>
        <div className="max-w-md">
          <SignIn/>
        </div>
      </div>

    </div>
  )
}
export default  page