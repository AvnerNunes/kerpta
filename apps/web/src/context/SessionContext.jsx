import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const SessionContext =
  createContext(null);

export function SessionProvider({
  children,
}) {
  const [
    session,
    setSession,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const checkSession =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/auth/session",
              {
                credentials:
                  "include",
              }
            );

          const data =
            await response.json();

          if (
            response.ok &&
            data.authenticated
          ) {
            setSession({
              user:
                data.user,

              marketplace:
                data.marketplace,
            });

            return true;
          }

          setSession(null);

          return false;
        } catch {
          setSession(null);

          return false;
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function logout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials:
            "include",
        }
      );
    } finally {
      setSession(null);
    }
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        user:
          session?.user ??
          null,

        marketplace:
          session?.marketplace ??
          null,

        authenticated:
          Boolean(session),

        loading,

        checkSession,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context =
    useContext(
      SessionContext
    );

  if (!context) {
    throw new Error(
      "useSession deve ser usado dentro de SessionProvider."
    );
  }

  return context;
}