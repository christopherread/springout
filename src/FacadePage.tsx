import React, { useEffect, useState } from 'react';
import './FacadePage.css';
import { firebaseStore } from './firebase';
import * as _ from 'lodash';

interface FacadePageProps {
    match: {
        params: {
            categoryId: string;
        }
    };
}

interface categoryImages {
    [key: string]: string
}
const imagesDoc = (id: string) => firebaseStore.collection('images').doc(id);

const FacadePage = (props: FacadePageProps) => {
    const [images, setImages] = useState(null as categoryImages | null);
    const [error, setError] = useState(null as Error | null);

    const category = props.match.params.categoryId;
    useEffect(() => imagesDoc(category).onSnapshot(s => setImages(s.data() as categoryImages), setError), [category]);

    if (error) {
        return (
            <div>{error.message}</div>
        )
    }
    if (!images) {
        return (
            <div>loading</div>
        )
    }

    return (
        <div className="facade-page">
            {
                _.map(images, (url, fileName) =>
                    <div
                        className="img-tile"
                        key={fileName}
                        style={{ backgroundImage: `url(${url})` }}
                    />)
            }
            <div className="title-card">
                <h1>{category.toUpperCase()}</h1>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
            </div>
        </div>
    )
}

export default FacadePage;