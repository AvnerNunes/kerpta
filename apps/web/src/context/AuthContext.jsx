import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../lib/supabase.js";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [session, setSession] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data,
      } =
        await supabase.auth
          .getSession();

      if (!mounted) {
        return;
      }

      setSession(
        data.session ?? null
      );

      setLoading(false);
    }

    loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            newSession
          ) => {
            setSession(
              newSession ?? null
            );

            setLoading(false);
          }
        );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  async function signIn(
    email,
    password
  ) {
    return supabase.auth
      .signInWithPassword({
        email,
        password,
      });
  }

  async function signUp(
    email,
    password
  ) {
    return supabase.auth
      .signUp({
        email,
        password,
      });
  }

  async function signOut() {
    return supabase.auth
      .signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user:
          session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser usado dentro de AuthProvider."
    );
  }

  return context;
}