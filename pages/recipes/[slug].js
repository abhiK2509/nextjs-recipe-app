//dynamic route
import { useState } from "react";
import { useRouter } from "next/router";
import {
    sanityClient,
    urlFor,
    usePreviewSubscription,
    Portabletext
} from "../../lib/sanity";

const recipeQuery = `*[_type == "recipe" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    mainImage,
    ingredient[]{
        _key,
        unit,
        wholeNumber,
        fraction,
        ingredient->{
            name
        }
    },
    instructions,
    likes
}`;

export default function OneRecipe({ data, preview }) {
    const router = useRouter();
    const slug = data?.recipe?.slug?.current;
    const existLikes = data?.recipe?.likes;
    const { data: recipe } = usePreviewSubscription(recipeQuery, {
        params: { slug },
        initialData: data,
        enabled: preview
    });
    const [likes, setLikes] = useState(existLikes);
    if (!router.isFallback && !slug) {
        return <div>Loading...</div>;
    }
    const addLike = async () => {
        const res = await fetch("/api/handle-like", {
            method: "POST",
            body: JSON.stringify({ _id: recipe._id })
        }).catch(error => console.log(error));

        const data = await res.json();
        setLikes(data.likes);
    };

    return (
        <article className="recipe">
            <h1>{recipe?.name}</h1>
            <button className="like-button" onClick={addLike}>{likes} ❤</button>
            <main className="content">
                {recipe?.mainImage && <img src={urlFor(recipe.mainImage).url()} alt={recipe?.name} />}
                <div className="breakdown">
                    <ul className="ingredients">
                        {recipe?.ingredient?.map(item => (
                            <li key={item._key} className="ingredient">
                                {item?.wholeNumber}
                                {" "}
                                {item?.fraction}
                                {" "}
                                {item?.unit}
                                <br />
                                {item?.item?.name}
                            </li>
                        ))}
                    </ul>
                    <Portabletext blocks={recipe?.instructions} className="instructions" />
                </div>
            </main>
        </article>
    );
}

export async function getStaticPaths() {
    const paths = await sanityClient.fetch(`*[_type == "recipe" && defined(slug.current)]{
        "params": {
            "slug": slug.current
        }
    }`);
    return {
        paths,
        fallback: true
    }
}

export async function getStaticProps({ params }) {
    const { slug } = params;
    const recipe = await sanityClient.fetch(recipeQuery, { slug });
    return { props: { data: { recipe }, preview: true } };
}