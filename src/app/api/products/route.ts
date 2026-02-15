import { NextResponse } from "next/server";
import { productService } from "@/lib/services/product.service";

export async function GET() {
  const products = await productService.list();
  return NextResponse.json(products);
}
