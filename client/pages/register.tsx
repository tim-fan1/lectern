import Link from "next/link";
import Navigation from "../components/Navigation";

export default function Register() {
    return (
        <div>
            <Navigation />
            <div className="container_center">
                <h1>Register an instructor account</h1>
                <form className="form">
                    <div className="container_input_label">
                        <label className="label" htmlFor="">
                            Name
                        </label>
                        <input className="input" type="email" />
                    </div>
                    <div className="container_input_label">
                        <label className="label" htmlFor="">
                            Email
                        </label>
                        <input className="input" id="email" type="email" />
                    </div>
                    <div className="container_input_label">
                        <label className="label" htmlFor="">
                            Password
                        </label>
                        <input className="input" id="email" type="password" />
                    </div>
                    <div className="container_input_label">
                        <label className="label" htmlFor="">
                            Confirm password
                        </label>
                        <input className="input" id="email" type="password" />
                    </div>
                    <button className="btn btn_primary" type="submit">
                        Register
                    </button>
                    <Link href="/login">
                        <a>Already have an account?</a>
                    </Link>
                </form>
            </div>
        </div>
    );
}
