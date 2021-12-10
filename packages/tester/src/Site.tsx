import React from 'react';

export default function Site(props: React.PropsWithChildren<{}>) {
    return (
        <div className="App">
            <header className="App-header">
                <div className="mx-auto">
                    <h1>Welcome to Symbol Storage!</h1>
                </div>
                <div>{props.children}</div>
            </header>
        </div>
    );
}
