import React, { ReactNode, useContext, useState } from "react";

type ContextAuthType = {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
};

const ContextAuth = React.createContext<ContextAuthType>({
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
});

export function useAuth() {
    return useContext(ContextAuth);
}

type Props = {
    children: ReactNode;
};

export function ContextAuthProvider({ children }: Props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = () => {
        setIsAuthenticated(true);
    };

    const logout = () => {
        setIsAuthenticated(false);
    };

    const value = {
        isAuthenticated,
        login,
        logout,
    };

    return <ContextAuth.Provider value={value}>{children}</ContextAuth.Provider>;
}
