import ProductForm from "../../../create/components/product-form";

export default function ProductEditPage({ id }: { id: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update data product/jasa kamu.
        </p>

        <div className="mt-6 rounded-2xl border bg-white p-6">
          <ProductForm mode="edit" productId={id} />
        </div>
      </div>
    </div>
  );
}
