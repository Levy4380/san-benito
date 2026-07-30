import { SVGAttributes } from 'react';

/** Botanical leaf mark — San Benito */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 2C12 8 7 15.5 7 23.5C7 30.5 12.5 36 20 36C27.5 36 33 30.5 33 23.5C33 15.5 28 8 20 2ZM20 8.5C24.8 13.2 27.5 18.2 27.5 23.5C27.5 27.6 24.4 30.5 20 30.5C15.6 30.5 12.5 27.6 12.5 23.5C12.5 18.2 15.2 13.2 20 8.5ZM19 14V29H21V14H19Z"
            />
        </svg>
    );
}
