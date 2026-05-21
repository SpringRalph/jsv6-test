"use client";

import ButtonBasic from "../buttons-basic/ButtonBasic";
import { BCDCContainer } from "../bcdc/page";

export default function ButtonCollectionWithoutPayLater() {
    return (
        <div className="w-full min-h-[60px] flex flex-col">
            <ButtonBasic />
            <BCDCContainer bcdcEndPoint="/api/paypal/order/create/create-order-bcdc-with-more-info" />
        </div>
    );
}
