// TypeScript Type ကို React Props မှာ အသုံးချခြင်း

import * as z from 'zod'

const payLoad = {
  name: 'keyboard',
  price: '49.99',
}

const ProductSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
})

type Product = z.infer<typeof ProductSchema>

function ProductDetail({ product }: { product: Product }) {
  return (
    <article>
      <h2> {product.name} </h2>
      <p> {product.price.toFixed(2)} </p>
    </article>
  )
}

function ProductPage() {
  const result = ProductSchema.safeParse(payLoad)

  if (result.success) {
    return <ProductDetail product={result.data} />
  }

  return (
    <ul>
      {result.error.issues.map((issue, index) => (
        <li key={issue.path.join('.')+issue.code+index}>
          {issue.message}
        </li>
      ))}
    </ul >
  )
}
export default ProductDetail

// Phase 2 - Lesson 9: Zod Runtime Schema Validation 
// const payLoad: unknown = {
//   name: "Keyboard",
//   price: "49.99",
// }

// const ProductSchema = z.object({
//   name: z.string().min(1),
//   price: z.number().positive(),
// })

// type Product = z.infer<typeof ProductSchema>
// const result = ProductSchema.safeParse(payLoad)

// function Product() {
//   return(
//     <>
//       {
//         result.success? (
//           <p> {result.data.name} <br /> {result.data.price} </p>
//         ): (
//           <ul>
//             {result.error.issues.map((issue,index) => (
//               <li key={index}>{issue.message}</li>
//             ))}
//           </ul>
//         )
//       }
//     </>
//   )
// } 


//<>
// <>
//   <h2>Zod Runtime Validation</h2>
//   <p>
//     Success: {String(result.success)}
//   </p>

//   {
//     result.error? (
//       <ul>
//         {result.error.issues.map((issue,index) => (
//           <li key={index}>{issue.message}</li>
//         ))}
//       </ul>
//     ): null
//   }

//   {/* {result.success ? (
//     <p>
//       Product: {result.data.name} - ${result.data.price}
//     </p>
//   ) : (
//     <ul>
//       {result.error.issues.map((issue, index) => (
//         <li key={index}> {issue.message} </li>
//       ))}
//     </ul>
//   )} */}
// </>
//