import React from 'react';
import './Who.scss';

const UrlCard = ({name, url}) => <a className="url-card" target="_blank" rel="noopener noreferrer" href={url}>{name}</a>;

const LegacyStack = ({name, intro, url, stackCss}) => (
    <div className="row">
        <div className="col-sm-3"/>
        <div className="col-sm-6">
            <a className={stackCss} target="_blank" rel="noopener noreferrer" href={url}>
                <strong>{name}</strong>
                <div>{intro}</div>
            </a>
        </div>
        <div className="col-sm-3"/>
    </div>
);

export default class Who extends React.Component {
    render() {
        return (
            <div className="who">
                <div className="row">
                    <div className="col-sm-6">
                        <img alt="nero" src="/knero-1.png"/>
                    </div>
                    <div className="col-sm-6 my-info">
                        <div className="nickname">K.Nero</div>
                        <div>kwon-s-m@daum.net</div>
                        <div className="intro">
                            #Java #C# #Backend #FullSt... #React_Native #React #Spring #Android #iOS #app_publishing
                            #I_love_Network #AWS #SQL_a_little #CTO_Mask_maybe
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12">
                        <UrlCard name="Linked in" url="https://www.linkedin.com/in/seongminKwon" colCss="col-sm-3"/>
                        <UrlCard name="github" url="https://github.com/KNero?tab=repositories" colCss="col-sm-3"/>
                        <UrlCard name="tistory" url="https://jamcode.tistory.com" colCss="col-sm-3"/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12 legacy-stack-text">github repository</div>
                </div>
                <LegacyStack name="OS Study"
                             intro="책 [64비트 멀티코어 OS 원리와구조] 따라하기"
                             url="https://github.com/KNero/os-study"
                             stackCss="legacy-stack-os"/>
                <LegacyStack name="jwt-security"
                             intro="JWT 와 Role 을 통한 서비스 접근 제어"
                             url="https://github.com/KNero/jwt-security"
                             stackCss="legacy-stack-jwt"/>
                <LegacyStack name="ExOf"
                             intro="가벼운 프레임워크. 쉬운 사용 방법을 통한 빠른 서비스 호출"
                             url="https://knero.github.io/ExOf"
                             stackCss="legacy-stack-exof"/>
                <LegacyStack name="SQLite-Helper"
                             intro="SQLite Multi Thread And Single Connection Pool"
                             url="https://knero.github.io/SQLite-Helper/"
                             stackCss="legacy-stack-sqlite"/>
                <LegacyStack name="poi-relative-cell"
                             intro="Improved use to POI"
                             url="https://github.com/KNero/poi-relative-cell"
                             stackCss="legacy-stack-cell"/>
                <LegacyStack name="FileQueue"
                             intro="Serverless file queue"
                             url="https://github.com/KNero/FileQueue"
                             stackCss="legacy-stack-queue"/>
                <LegacyStack name="ETree"
                             intro="javascript tree component"
                             url="https://github.com/KNero/ETree"
                             stackCss="legacy-stack-etree"/>
            </div>
        );
    }
}