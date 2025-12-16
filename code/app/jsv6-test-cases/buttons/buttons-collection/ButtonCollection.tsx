"use client";

import ButtonBasic from "../buttons-basic/ButtonBasic";
import PayLater from "../../PLM/pay-later/PayLater";
import { BCDCContainer } from "../bcdc/page";

export default function ButtonCollection() {
    return (
        <div className="w-full min-h-[60px] flex flex-col">
            <ButtonBasic />
            <PayLater />
            <BCDCContainer />
        </div>
    );
}
