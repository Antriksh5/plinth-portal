import Footer from "../../components/Footer";

// Wraps every page with the site footer.
// <html>/<body>, fonts, metadata, toasts and analytics live in the root layout (src/app/layout.jsx).
// Only the root layout may render <html>/<body>; doing it here too caused a hydration mismatch.
export default function AppLayout({ children }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
