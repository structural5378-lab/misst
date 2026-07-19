import { Navigate } from "react-router-dom";

/**
 * ForumRegister — retired.
 * The forum is now a native MIST module; a MIST account already grants full
 * community/forum access with no separate registration or login. This route is
 * kept as a redirect for any legacy links.
 */
export default function ForumRegister() {
  return <Navigate to="/community-forum" replace />;
}