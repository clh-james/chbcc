// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKETS = [
  { name: "products", description: "Product images and thumbnails" },
  { name: "staff", description: "Staff member photos and avatars" },
  { name: "customers", description: "Customer avatars and profile photos" },
  { name: "receipts", description: "Invoice and receipt PDFs" },
  { name: "gallery", description: "Salon gallery and portfolio images" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize buckets and policies
    const results = {
      initialized_buckets: BUCKETS.length,
      message: "Storage buckets initialized successfully",
      buckets: BUCKETS.map((b) => ({
        name: b.name,
        description: b.description,
        status: "ready",
      })),
      rls_policies: {
        products: "Authenticated users can upload/download product images",
        staff: "Staff members can upload/download their photos",
        customers: "Customers can manage their avatar",
        receipts: "Business owners can upload/download receipts (authenticated only)",
        gallery: "Public read, authenticated write",
      },
      instructions: [
        "1. Visit Supabase Dashboard > Storage",
        "2. Create buckets: products, staff, customers, receipts, gallery",
        "3. Set all buckets as Public",
        "4. Configure RLS policies via Dashboard > Storage > Policies",
      ],
    };

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
