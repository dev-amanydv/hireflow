import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/store/store";


export function useStartInterview() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const openAuthModal = useAuth((s) => s.openAuthModal);

  return useCallback(() => {
    if (user) {
      navigate("/start");
      return;
    }
    openAuthModal({ mode: "signup", onSuccess: () => navigate("/start") });
  }, [user, navigate, openAuthModal]);
}
