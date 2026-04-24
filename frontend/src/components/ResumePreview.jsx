const ResumePreview = ({ data, template }) => {
  const { personal, experience, education, skills, customSections } = data;

  const renderModern = () => (
    <div className="resume-modern">
      <div className="resume-header">
        <h1>{personal?.fullName || 'Ваше имя'}</h1>
        <p className="title">{personal?.title || 'Должность'}</p>
        <div className="contact-info">
          {personal?.email && <span><i className="fas fa-envelope"></i> {personal.email}</span>}
          {personal?.phone && <span><i className="fas fa-phone"></i> {personal.phone}</span>}
          {personal?.address && <span><i className="fas fa-map-marker-alt"></i> {personal.address}</span>}
        </div>
      </div>
      {personal?.summary && (
        <div className="section">
          <h2>О себе</h2>
          <p>{personal.summary}</p>
        </div>
      )}
      {experience?.length > 0 && (
        <div className="section">
          <h2>Опыт работы</h2>
          {experience.map((exp, idx) => (
            <div key={idx} className="entry">
              <h3>{exp.position} · {exp.company}</h3>
              <p className="date">{exp.startDate} — {exp.endDate}</p>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      {education?.length > 0 && (
        <div className="section">
          <h2>Образование</h2>
          {education.map((edu, idx) => (
            <div key={idx} className="entry">
              <h3>{edu.degree}, {edu.institution}</h3>
              <p className="date">{edu.year}</p>
              <p>{edu.description}</p>
            </div>
          ))}
        </div>
      )}
      {skills?.length > 0 && (
        <div className="section">
          <h2>Навыки</h2>
          <ul className="skills-list">
            {skills.map((skill, idx) => (
              <li key={idx}>{skill.name}</li>
            ))}
          </ul>
        </div>
      )}
      {customSections?.map((section, idx) => (
        <div key={idx} className="section">
          <h2>{section.title}</h2>
          <p>{section.content}</p>
        </div>
      ))}
    </div>
  );

  const renderClassic = () => (
    <div className="resume-classic">
      <div className="resume-header">
        <h1>{personal?.fullName || 'Ваше имя'}</h1>
        <p>{personal?.title || 'Должность'}</p>
        <hr />
        <div className="contact-info">
          {personal?.email && <span><i className="fas fa-envelope"></i> {personal.email}</span>}
          {personal?.phone && <span><i className="fas fa-phone"></i> {personal.phone}</span>}
          {personal?.address && <span><i className="fas fa-map-marker-alt"></i> {personal.address}</span>}
        </div>
      </div>
      {personal?.summary && (
        <div className="section">
          <h2>Profile</h2>
          <p>{personal.summary}</p>
        </div>
      )}
      {experience?.length > 0 && (
        <div className="section">
          <h2>Work Experience</h2>
          {experience.map((exp, idx) => (
            <div key={idx} className="entry">
              <h3>{exp.position} at {exp.company}</h3>
              <p className="date">{exp.startDate} — {exp.endDate}</p>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      {education?.length > 0 && (
        <div className="section">
          <h2>Education</h2>
          {education.map((edu, idx) => (
            <div key={idx} className="entry">
              <h3>{edu.degree}, {edu.institution}</h3>
              <p className="date">{edu.year}</p>
              <p>{edu.description}</p>
            </div>
          ))}
        </div>
      )}
      {skills?.length > 0 && (
        <div className="section">
          <h2>Skills</h2>
          <ul className="skills-list">
            {skills.map((skill, idx) => (
              <li key={idx}>{skill.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderElegant = () => (
    <div className="resume-elegant">
      <div className="resume-header">
        <div className="name-title">
          <h1>{personal?.fullName || 'Ваше имя'}</h1>
          <p className="title">{personal?.title || 'Должность'}</p>
        </div>
        <div className="contact-info">
          {personal?.email && <span><i className="fas fa-envelope"></i> {personal.email}</span>}
          {personal?.phone && <span><i className="fas fa-phone"></i> {personal.phone}</span>}
          {personal?.address && <span><i className="fas fa-map-marker-alt"></i> {personal.address}</span>}
        </div>
      </div>
      <div className="resume-body">
        <div className="left-column">
          {personal?.summary && (
            <div className="section">
              <h2>О себе</h2>
              <p>{personal.summary}</p>
            </div>
          )}
          {skills?.length > 0 && (
            <div className="section">
              <h2>Навыки</h2>
              <ul className="skills-list">
                {skills.map((skill, idx) => (
                  <li key={idx}>{skill.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="right-column">
          {experience?.length > 0 && (
            <div className="section">
              <h2>Опыт работы</h2>
              {experience.map((exp, idx) => (
                <div key={idx} className="entry">
                  <h3>{exp.position}</h3>
                  <p className="company">{exp.company}</p>
                  <p className="date">{exp.startDate} — {exp.endDate}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
          )}
          {education?.length > 0 && (
            <div className="section">
              <h2>Образование</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="entry">
                  <h3>{edu.degree}</h3>
                  <p className="institution">{edu.institution}</p>
                  <p className="date">{edu.year}</p>
                  <p>{edu.description}</p>
                </div>
              ))}
            </div>
          )}
          {customSections?.map((section, idx) => (
            <div key={idx} className="section">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMinimal = () => (
    <div className="resume-minimal">
      <div className="resume-header">
        <h1>{personal?.fullName || 'Ваше имя'}</h1>
        <p className="title">{personal?.title || 'Должность'}</p>
        <div className="contact-info">
          {personal?.email && <span>{personal.email}</span>}
          {personal?.phone && <span>{personal.phone}</span>}
          {personal?.address && <span>{personal.address}</span>}
        </div>
      </div>
      <div className="resume-content">
        {personal?.summary && (
          <div className="section">
            <h2>О себе</h2>
            <p>{personal.summary}</p>
          </div>
        )}
        {experience?.length > 0 && (
          <div className="section">
            <h2>Опыт работы</h2>
            {experience.map((exp, idx) => (
              <div key={idx} className="entry">
                <h3>{exp.position}</h3>
                <p className="company">{exp.company}</p>
                <p className="date">{exp.startDate} — {exp.endDate}</p>
                <p>{exp.description}</p>
              </div>
            ))}
          </div>
        )}
        {education?.length > 0 && (
          <div className="section">
            <h2>Образование</h2>
            {education.map((edu, idx) => (
              <div key={idx} className="entry">
                <h3>{edu.degree}</h3>
                <p className="institution">{edu.institution}</p>
                <p className="date">{edu.year}</p>
                <p>{edu.description}</p>
              </div>
            ))}
          </div>
        )}
        {skills?.length > 0 && (
          <div className="section">
            <h2>Навыки</h2>
            <div className="skills-list">
              {skills.map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill.name}</span>
              ))}
            </div>
          </div>
        )}
        {customSections?.map((section, idx) => (
          <div key={idx} className="section">
            <h2>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
  const renderCreative = () => (
    <div className="resume-creative">
      <div className="resume-header">
        <h1>{personal?.fullName || 'Ваше имя'}</h1>
        <p className="title">{personal?.title || 'Должность'}</p>
        <div className="contact-info">
          {personal?.email && <span><i className="fas fa-envelope"></i> {personal.email}</span>}
          {personal?.phone && <span><i className="fas fa-phone"></i> {personal.phone}</span>}
          {personal?.address && <span><i className="fas fa-map-marker-alt"></i> {personal.address}</span>}
        </div>
      </div>
      <div className="resume-body">
        <div className="left-column">
          {personal?.summary && (
            <div className="section">
              <h2>О себе</h2>
              <p>{personal.summary}</p>
            </div>
          )}
          {skills?.length > 0 && (
            <div className="section">
              <h2>Навыки</h2>
              <div className="skills-list">
                {skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="right-column">
          {experience?.length > 0 && (
            <div className="section">
              <h2>Опыт работы</h2>
              {experience.map((exp, idx) => (
                <div key={idx} className="entry">
                  <h3>{exp.position}</h3>
                  <p className="company">{exp.company}</p>
                  <p className="date">{exp.startDate} — {exp.endDate}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
          )}
          {education?.length > 0 && (
            <div className="section">
              <h2>Образование</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="entry">
                  <h3>{edu.degree}</h3>
                  <p className="institution">{edu.institution}</p>
                  <p className="date">{edu.year}</p>
                  <p>{edu.description}</p>
                </div>
              ))}
            </div>
          )}
          {customSections?.map((section, idx) => (
            <div key={idx} className="section">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBold = () => (
    <div className="resume-bold">
      <div className="resume-header">
        <div>
          <h1>{personal?.fullName || 'Ваше имя'}</h1>
          <p className="title">{personal?.title || 'Должность'}</p>
        </div>
        <div className="contact-info">
          {personal?.email && <span><i className="fas fa-envelope"></i> {personal.email}</span>}
          {personal?.phone && <span><i className="fas fa-phone"></i> {personal.phone}</span>}
          {personal?.address && <span><i className="fas fa-map-marker-alt"></i> {personal.address}</span>}
        </div>
      </div>
      <div className="resume-body">
        <div className="left-column">
          {personal?.summary && (
            <div className="section">
              <h2>О себе</h2>
              <p>{personal.summary}</p>
            </div>
          )}
          {skills?.length > 0 && (
            <div className="section">
              <h2>Навыки</h2>
              <div className="skills-list">
                {skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="right-column">
          {experience?.length > 0 && (
            <div className="section">
              <h2>Опыт работы</h2>
              {experience.map((exp, idx) => (
                <div key={idx} className="entry">
                  <h3>{exp.position}</h3>
                  <p className="company">{exp.company}</p>
                  <p className="date">{exp.startDate} — {exp.endDate}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
          )}
          {education?.length > 0 && (
            <div className="section">
              <h2>Образование</h2>
              {education.map((edu, idx) => (
                <div key={idx} className="entry">
                  <h3>{edu.degree}</h3>
                  <p className="institution">{edu.institution}</p>
                  <p className="date">{edu.year}</p>
                  <p>{edu.description}</p>
                </div>
              ))}
            </div>
          )}
          {customSections?.map((section, idx) => (
            <div key={idx} className="section">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <div className="resume-preview">
      {template === 'modern' && renderModern()}
      {template === 'classic' && renderClassic()}
      {template === 'elegant' && renderElegant()}
      {template === 'minimal' && renderMinimal()}
      {template === 'creative' && renderCreative()}  {/* ✅ Добавлено */}
      {template === 'bold' && renderBold()}          {/* ✅ Добавлено */}
    </div>
  );
};

export default ResumePreview;