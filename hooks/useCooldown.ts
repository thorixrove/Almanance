import { useCallback, useEffect, useRef, useState } from "react"

export function useCooldown(seconds: number) {
    const [remaining, setRemaining] = useState(0)
    const timer = useRef<ReturnType<typeof setInterval> | null>(null)

    const clear = () => {
        if (timer.current) {
            clearInterval(timer.current)
            timer.current = null
        }
    }

    const start =  useCallback(() => {
        clear()
        setRemaining(seconds)
        timer.current = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clear()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [seconds])

    useEffect(() => clear, [])
    return {remaining, start}
}