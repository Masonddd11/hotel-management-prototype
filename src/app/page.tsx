import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Link href="/admin/login">
        <Button>
          Admin Login
        </Button>
      </Link>

      <Link href="/guest/login">
        <Button>
          Guest Login
        </Button>
      </Link>
    </>
  )
}