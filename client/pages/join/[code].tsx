import { useRouter } from 'next/router'
import Navigation from '../../components/Navigation'

function JoinWithCode() {
    const router = useRouter()
    const { code } = router.query

    return (
        <div>
            <Navigation />
            <p>Code: {code}</p>
        </div>
    )
}

export default JoinWithCode
