import { render, Text, useApp, useStdin } from 'ink';
import React, { useState } from 'react';

type TuiOptions = {
    api_address: string;
}

export const render_tui = (options: TuiOptions) => {
    render(<Tui {...options} />); 
}

const Tui: React.FC<TuiOptions> = (props) => {

    return <>
        <Text>
            Welcome to the nqueue cli client.
        </Text>
    </>
}
