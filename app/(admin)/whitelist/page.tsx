import ResourcePage from "../_crud/page-body";

export const metadata = { title: "Whitelisted emails | Admin" };

export default function Page() {
  return <ResourcePage resource="whitelist" />;
}
