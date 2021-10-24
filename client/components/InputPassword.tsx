import type { SetStateAction } from "react";

interface Props {
    setValue: (value: SetStateAction<string>) => void;
}

export default function InputPassword({ setValue }: Props) {
    return (
        <input
            className="input"
            type="password"
            minLength={8}
            maxLength={30}
            onChange={(e) => setValue((e.target as HTMLInputElement).value)}
            required
        />
    );
}
